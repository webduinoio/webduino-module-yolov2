+(function (window, document) {
  'use strict';

  function loadJS(filePath) {
    var req = new XMLHttpRequest();
    req.open("GET", filePath, false); // 'false': synchronous.
    req.send(null);
    var headElement = document.getElementsByTagName("head")[0];
    var newScriptElement = document.createElement("script");
    newScriptElement.type = "text/javascript";
    newScriptElement.text = req.responseText;
    headElement.appendChild(newScriptElement);
  }
  
  function hasGetUserMedia() {
    return !!(navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia);
  }
  
  function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    let ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return { width: srcWidth*ratio, height: srcHeight*ratio };
  }

  loadJS('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.2/dist/tf.min.js');

  class BoundBox {
    constructor(classes) {
      this.x = 0;
      this.y = 0;
      this.w = 0;
      this.h = 0;
      this.c = 0;
      this.classNum = classes;
      this._probs;
    }
  
    set probs(probs) {
      if (this._probs) this.dispose();
      this._probs = tf.tidy(() => tf.tensor(probs));
    }
  
    get probs() {
      return this._probs;
    }
  
    dispose() {
      return this._probs.dispose();
    }
  }
  
  class YOLOv2 {
    async init(modelUrl) {
      if (this.inited) {
        console.warn('YOLOv2 already initialized');
        return;
      }
  
      try {
        // load model
        this.model = await tf.loadGraphModel(modelUrl);
      } catch (err) {
        throw err;
      }
      // load model meta
      this.meta = await (await fetch(modelUrl.replace('model.json', 'model.meta'))).json();
      this.inited = true;
    }
  
    set inited(value) {
      if (this.model && value === true) {
        this._inited = true;
        Object.freeze(this.model);
        Object.freeze(this.meta);
        Object.freeze(this._inited);
      }
    }
  
    get inited() {
      if (this.model) {
        return this._inited;
      } else {
        return false;
      }
    }
  
    expit(x) {
      return 1 / (1 + Math.exp(-x));
    }
  
    overlap(x1, w1, x2, w2) {
      let l1, l2, r1, r2, left, right;
      l1 = x1 - w1 / 2;
      l2 = x2 - w2 / 2;
      left = Math.max(l1, l2);
      r1 = x1 + w1 / 2;
      r2 = x2 + w2 / 2;
      right = Math.min(r1, r2);
      return right - left;
    }
  
    boxUnion(ax, ay, aw, ah, bx, by, bw, bh) {
      let i, u;
      i = this.boxIntersection(ax, ay, aw, ah, bx, by, bw, bh);
      u = aw * ah + bw * bh - i;
      return u;
    }
  
    boxIntersection(ax, ay, aw, ah, bx, by, bw, bh) {
      let w, h, area;
      w = this.overlap(ax, aw, bx, bw);
      h = this.overlap(ay, ah, by, bh);
      if (w < 0 || h < 0) return 0;
      area = w * h;
      return area;
    }
  
    boxIOU(ax, ay, aw, ah, bx, by, bw, bh) {
      return this.boxIntersection(ax, ay, aw, ah, bx, by, bw, bh) / this.boxUnion(ax, ay, aw, ah, bx, by, bw, bh);
    }
  
    async NMS(finalProbs, finalBbox) {
      let boxes = [];
      let indices = [];
      let predLength = finalBbox.shape[0];
      let classLength = finalProbs.shape[1];
  
      finalProbs = await finalProbs.array();
      finalBbox = await finalBbox.array();
  
      for (let class_loop = 0; class_loop < classLength; class_loop++) {
        for (let index = 0; index < predLength; index++) {
          if (finalProbs[index][class_loop] === 0) continue;
          for (let index2 = index + 1; index2 < predLength; index2++) {
            if (finalProbs[index2][class_loop] === 0) continue;
            if (index === index2) continue;
            if (this.boxIOU(finalBbox[index][0], finalBbox[index][1], finalBbox[index][2], finalBbox[index][3], finalBbox[index2][0], finalBbox[index2][1], finalBbox[index2][2], finalBbox[index2][3]) >= 0.4) {
              if (finalProbs[index2][class_loop] > finalProbs[index][class_loop]) {
                finalProbs[index][class_loop] = 0;
                break;
              }
              finalProbs[index2][class_loop] = 0;
            }
          }
  
          if (indices.indexOf(index) < 0) {
            let bb = new BoundBox(classLength);
            bb.x = finalBbox[index][0];
            bb.y = finalBbox[index][1];
            bb.w = finalBbox[index][2];
            bb.h = finalBbox[index][3];
            bb.c = finalBbox[index][4];
            bb.probs = finalProbs[index];
            boxes.push(bb);
            indices.push(index);
          }
        }
      }
      return boxes;
    }
  
    async parseBox(b, h, w, opts = {}) {
      const labels = opts.labels;
      const threshold = opts.threshold;
      const argmax = await tf.tidy(() => tf.argMax(b.probs));
      const maxIndex = await argmax.data();
      const maxProb = (await b.probs.data())[maxIndex];
      const label = labels && labels[maxIndex] || maxIndex;
  
      argmax.dispose();
      b.dispose();
  
      if (maxProb > threshold) {
        let left = ((b.x - b.w / 2) * w);
        let right = ((b.x + b.w / 2) * w);
        let top = ((b.y - b.h / 2) * h);
        let bot = ((b.y + b.h / 2) * h);
  
        if (left < 0) left = 0;
        if (right > (w - 1)) right = w - 1;
        if (top < 0) top = 0;
        if (bot > (h - 1)) bot = h - 1;
        let width = right - left;
        let height = bot - top;
        return {
          left,
          right,
          top,
          bot,
          label,
          maxIndex,
          maxProb,
          width,
          height
        };
      }
  
      return;
    }
  
    async findBoxes(predictResult) {
      let tempc, arr_max = 0,
        sum = 0;
      const anchors = this.meta['anchors']
      const [H, W, _] = this.meta['out_size']
      const C = this.meta['classes']
      const B = this.meta['num']
      const threshold = this.meta['thresh']
  
      // removes dimensions of size 1 from the shape
      const netIn = predictResult.squeeze();
      const netOut = await tf.tidy(() => netIn.reshape([H, W, B, netIn.shape[2] / B]));
      // slice from ([0, 0, 0, <position>], size?)
      // float[:, :, :, ::1] Classes = netOut[:, :, :, 5:]
      let Classes = await tf.tidy(() => netOut.slice([0, 0, 0, 5]));
      let ClassesArr = await Classes.array();
      // // float[:, :, :, ::1] Bbox_pred =  netOut[:, :, :, :5]
      let BboxPred = await tf.tidy(() => netOut.slice([0, 0, 0, 0], [-1, -1, -1, 5]));
      let BboxPredArr = await BboxPred.array();
      // // float[:, :, :, ::1] probs = np.zeros((H, W, B, C), dtype=np.float32)
      let probs = await tf.tidy(() => tf.zeros([H, W, B, C], 'float32'));
      let probsArr = await probs.array();
  
      for (let row = 0; row < H; row++) {
        for (let col = 0; col < W; col++) {
          for (let box_loop = 0; box_loop < B; box_loop++) {
            arr_max = 0;
            sum = 0;
            BboxPredArr[row][col][box_loop][4] = this.expit(BboxPredArr[row][col][box_loop][4]);
            BboxPredArr[row][col][box_loop][0] = (col + this.expit(BboxPredArr[row][col][box_loop][0])) / W;
            BboxPredArr[row][col][box_loop][1] = (row + this.expit(BboxPredArr[row][col][box_loop][1])) / H;
            BboxPredArr[row][col][box_loop][2] = Math.exp(BboxPredArr[row][col][box_loop][2]) * anchors[2 * box_loop + 0] / W;
            BboxPredArr[row][col][box_loop][3] = Math.exp(BboxPredArr[row][col][box_loop][3]) * anchors[2 * box_loop + 1] / H;
  
            for (let class_loop = 0; class_loop < C; class_loop++) {
              arr_max = Math.max(arr_max, ClassesArr[row][col][box_loop][class_loop])
            }
  
            for (let class_loop = 0; class_loop < C; class_loop++) {
              ClassesArr[row][col][box_loop][class_loop] = Math.exp(ClassesArr[row][col][box_loop][class_loop] - arr_max);
              sum += ClassesArr[row][col][box_loop][class_loop];
            }
  
            for (let class_loop = 0; class_loop < C; class_loop++) {
              tempc = ClassesArr[row][col][box_loop][class_loop] * BboxPredArr[row][col][box_loop][4] / sum;
              if (tempc > threshold) {
                probsArr[row][col][box_loop][class_loop] = tempc;
              }
            }
          } // box_loop end
        }
      }
  
      const probsTensor = (await tf.tidy(() => tf.tensor(probsArr).reshape([H * W * B, C])));
      const BboxPredTensor = (await tf.tidy(() => tf.tensor(BboxPredArr).reshape([H * B * W, 5])));
      const boxes = await this.NMS(probsTensor, BboxPredTensor);
  
      // dispose everything!
      netOut.dispose();
      netIn.dispose();
      Classes.dispose();
      BboxPred.dispose();
      probs.dispose();
      probsTensor.dispose();
      BboxPredTensor.dispose();
  
      return boxes;
    }
  
    async predict(imgData, threshold = 0.5) {
      if (!this.inited) return [];
      const [netInHeight, netInWidth] = this.meta['inp_size'];
      const colors = this.meta['colors'];
      const model = this.model;
      // normalize input data
      const data = await tf.tidy(() => imgData.toFloat().div(255));
      // expand dims because input shape is [?, h, w, c]
      const tensor = await tf.tidy(() => data.expandDims());
      const result = await model.predict(tensor);
      const boxes = await this.findBoxes(result);
      const userThreshold = threshold;
      const userLabels = this.meta['labels'];
      let boxesInfo = [];
      for (let box in boxes) {
        let tmpBox = await this.parseBox(boxes[box], netInHeight, netInWidth, {
          labels: userLabels,
          threshold: userThreshold
        });
  
        if (!tmpBox) continue;
  
        boxesInfo.push({
          label: tmpBox.label,
          color: this.getHexColor(colors[tmpBox.maxIndex]),
          confidence: tmpBox.maxProb,
          topLeft: {
            x: Math.floor(tmpBox.left),
            y: Math.floor(tmpBox.top),
          },
          bottomRight: {
            x: Math.floor(tmpBox.right),
            y: Math.floor(tmpBox.bot),
          },
          width: Math.floor(tmpBox.width),
          height: Math.floor(tmpBox.height),
        });
      }
  
      // dispose unused tensor
      data.dispose();
      tensor.dispose();
      result.dispose();
  
      return boxesInfo;
    }

    setCanvas(canvas, orgImage, size = undefined) {
      const ctx = canvas.getContext('2d');
      this.canvas = {
        el: canvas,
        ctx: ctx,
      };

      const h = size && size[0] || orgImage.height;
      const w = size && size[1] || orgImage.width;

      canvas.setAttribute('height', h);
      canvas.setAttribute('width', w);
      canvas.style = "display: block";
      console.log('init canvas');
    }

    drawImage(canvas, image, size = undefined) {
      if (!this.canvas) {
        this.setCanvas(canvas, image, size);
      }

      const ctx = this.canvas.ctx;
      ctx.drawImage(image, 0, 0, image.width, image.height);
    }

    drawBoxes(predictResult, inputSize = undefined) {
      const [netInHeight, netInWidth] = inputSize || this.meta['inp_size'];

      if (!this.canvas) {
        throw new Error('Cannot draw boxes without image. Please draw an image first.')
      }

      const canvas = this.canvas.el;
      const ctx = this.canvas.ctx;
      // draw the box
      predictResult.forEach(box => {
        const label = box.label + ' ' + box.confidence.toFixed(1);
        const x = canvas.width * box.topLeft.x / netInWidth;
        const y = canvas.height * box.topLeft.y / netInHeight;
        const textPosY = y - 5;

        ctx.lineWidth = 3;
        ctx.strokeStyle = box.color || '#FF0000';
        ctx.beginPath();
        ctx.rect(x, y, canvas.width * box.width / netInWidth, canvas.height * box.height / netInHeight);
        ctx.stroke();

        ctx.fillStyle = box.color || '#FF0000';
        ctx.fillText(label, x, textPosY);
      });
    }
  
    render(imageTensor, predictResult, canvas) {
      if (!this.canvas) {
        const [netInHeight, netInWidth] = this.meta['inp_size'];
        const ctx = canvas.getContext('2d');
  
        this.canvas = {
          el: canvas,
          ctx: ctx,
        };
  
        let h = netInHeight, w = netInWidth;
        canvas.setAttribute('height', h);
        canvas.setAttribute('width', w);
        canvas.style = "display: block";
      }
  
      tf.browser.toPixels(imageTensor, canvas)
        .then(() => {
          this.drawBoxes(predictResult);
          imageTensor.dispose();
        });
    }
  
    async predictAndRender(imageTensor, canvas, opts = {}) {
      const userThreshold = opts.userThreshold || 0.5;
      const result = await this.predict(imageTensor, userThreshold);

      if (opts.image) {
        imageTensor.dispose();
        this.drawImage(canvas, opts.image);
        this.drawBoxes(result, opts.inputSize);
      } else {
        this.render(imageTensor, result, canvas);
      }
      return result;
    }
  
    getHexColor(color) {
      let hexColor = '#'
      for (let i = 0; i < color.length; i++) {
        let num = parseInt(color[i]);
        if (num <= 0) num = 0;
        else if (num >= 255) num = 255;
        hexColor += num.toString(16);
      }
      return hexColor;
    }
  
    dispose() {
      if (!this.model) return;
      this.model.dispose();
    }
  }

  let yolov2 = new YOLOv2();
  window._yolov2_ = (function () {
    let stopped = false;
    let labels = {};
    let results = [];
    let outputs = {};
    let predictInterval = 50, lastRun = Date.now();
    let modelUrl, orgImageSource, threshold;
    const canvas = document.createElement('canvas');

    let showResults = (results) => {
      outputs = {};
      results.forEach(result => {
        let label = result.label;
        if (!outputs[label]) outputs[label] = [];
        outputs[label].push(result);
      });

      // clear all results
      Object.keys(labels).forEach(label => {
        if (typeof labels[label] === "function") {
          labels[label](label, null);
        }
      });

      Object.keys(outputs).forEach(label => {
        if (typeof labels[label] === "function") {
          labels[label](label, outputs[label]);
        }
      });
    }

    return {
      init: async function(_modelUrl, _imageSource, _threshold) {
        if (yolov2.inited) throw new Error('YOLOv2 already initialized');
        if (_modelUrl && _imageSource && _threshold) {
          modelUrl = _modelUrl;
          orgImageSource = _imageSource;
          threshold = _threshold;
        }
        await yolov2.init(modelUrl);
        console.log('YOLOv2 initialized.', yolov2.inited, tf.version);
        await this.predict();
        return this;
      },

      setThreshold(_threshold = 0.5) {
        if (_threshold < 0) threshold = 0;
        else if (_threshold > 1) threshold = 1;
        else threshold = _threshold;
        console.log('new yolov2 threshold: ' + threshold);
      },

      stop: function() {
        stopped = true;
        stream.getTracks().forEach(function(track) {
          track.stop();
        });
        yolov2.dispose();
        yolov2 = new YOLOv2();
      },

      start: async function() {
        if (modelUrl && orgImageSource && threshold && !yolov2.inited && stopped) {
          stopped = false;
          await this.init();
        }
      },

      onLabel: function(idx, callback) {
        labels[idx] = callback;
      },

      getLabels: function() {
        if (!yolov2.inited) throw new Error('YOLOv2 is not initialized.');
        return yolov2.meta['labels'];
      },

      getResults: function(label) {
        if (!yolov2.inited) return;
        if (label) return outputs[label];
        return results.length > 0 ? outputs : null;
      },

      getBoxCenterPosition(box) {
        if (!(yolov2.inited && yolov2.canvas)) {
          return {x: null, y: null};
        }

        const canvas = yolov2.canvas.el;
        const [netInHeight, netInWidth] = yolov2.meta['inp_size'];
        const x = Math.round((canvas.width * box.topLeft.x / netInWidth) + (box.width / 2));
        const y = Math.round((canvas.height * box.topLeft.y / netInHeight) + (box.height / 2));
        return {x, y};
      },

      predict: async function() {
        if (!yolov2.inited) {
          throw new Error('yolov2 is not initialized');
        }

        // yolov2 = new YOLOv2();
        // await yolov2.init(modelUrl);
        let imageSource = orgImageSource;
        const [netInHeight, netInWidth] = yolov2.meta['inp_size'];

        if (imageSource.search(/^{\"source/) >= 0 && hasGetUserMedia()) {
          const inputObj = JSON.parse(imageSource);
                imageSource = inputObj.source;
          const resolution = inputObj.resolution.split('x');
          const video = document.createElement('video');
          const deviceId = imageSource.replace('webcam_', '');
          const oc = document.createElement('canvas'),
                oc2 = document.createElement('canvas'),
                octx = oc.getContext('2d'),
                octx2 = oc2.getContext('2d');

          let constraints = window.constraints = {
            audio: false,
            video: {
              width: {
                exact: resolution[0],
              },
              height: {
                exact: resolution[1],
              },
              deviceId: {
                exact: deviceId,
              }
            },
          };

          if (deviceId.search(/^mobile/) >= 0) {
            let facingMode = { exact: 'environment' };
            if (deviceId === 'mobile_front') facingMode.exact = 'user';
            constraints.video.deviceId = undefined;
            constraints.video.facingMode = facingMode;
          } else if (deviceId === 'auto') {
            constraints.video.deviceId = undefined;
          }

          async function predictWithVideo() {
            if (stopped) {
              console.log('yolov2 is stopped');
              return;
            } else if ((Date.now() - lastRun) < predictInterval) {
                window.requestAnimationFrame(predictWithVideo);
                return;
            } else {
                lastRun = Date.now();
            }

            const ratioFit = calculateAspectRatioFit(video.width, video.height, netInWidth, netInHeight);
            oc.width = ratioFit.width;
            oc.height = ratioFit.height;
            octx.drawImage(video, 0, 0, oc.width, oc.height);
            octx2.drawImage(oc, 0, 0, ratioFit.width, ratioFit.height, 0, 0, ratioFit.width, ratioFit.height);
      
            const imageTensor = await tf.tidy(() => tf.browser.fromPixels(oc2));
            results = await yolov2.predictAndRender(imageTensor, canvas, {
                userThreshold: threshold,
                image: video,
                inputSize: [oc.height, oc.width],
            });

            canvas.style = "width: 100%; height: 100%;";
            // show result
            showResults(results);
            // replay
            window.requestAnimationFrame(predictWithVideo);
          }

          try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const videoTracks = stream.getVideoTracks();
            console.log('device', deviceId);
            console.log('Got stream with constraints:', constraints);
            console.log(`Using video device: ${videoTracks[0].label}`);
            window.stream = stream; // make variable available to browser console
            const v = constraints.video;
            video.width = v.width && v.width.exact || '640';
            video.height = v.height && v.height.exact || '480';
            video.srcObject = stream;
            video.autoplay = true;
            video.style = "display: none;";

            document.body.appendChild(video);
            document.body.appendChild(canvas);
            // add listener
            video.addEventListener('loadedmetadata', () => {
              canvas.setAttribute('width', video.width);
              canvas.setAttribute('height', video.height);

              oc2.setAttribute('width', netInWidth);
              oc2.setAttribute('height', netInHeight);
              predictWithVideo();
            });
          } catch (error) {
            if (error.name === 'ConstraintNotSatisfiedError') {
              const v = constraints.video;
              console.error(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
            } else if (error.name === 'PermissionDeniedError') {
              console.error('Permissions have not been granted to use your camera and ' +
              'microphone, you need to allow the page access to your devices in ' +
              'order for the demo to work.');
            } 
            console.error(`getUserMedia error: ${error.name}`, error);
            document.body.innerText = error.name;
          }
        } else if(imageSource.search(/^(http|data:image).*/) >= 0){  // image
          const image = new Image();
          const [netInHeight, netInWidth] = yolov2.meta['inp_size'];
          const oc = document.createElement('canvas'),
                oc2 = document.createElement('canvas'),
                octx = oc.getContext('2d'),
                octx2 = oc2.getContext('2d');

          document.body.appendChild(canvas);
          canvas.setAttribute('width', image.width);
          canvas.setAttribute('height', image.height);

          oc2.setAttribute('width', netInWidth);
          oc2.setAttribute('height', netInHeight);

          image.setAttribute("crossOrigin", 'Anonymous');

          let fn;
          if (imageSource.search(/\/(stream|live)/) > 0) {
            // throw new Error('img stream cam is not supported');
            console.log('image stream');
            fn = () => {
              const ctx = canvas.getContext('2d');

              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              octx.setTransform(1, 0, 0, 1, 0, 0);
              octx.clearRect(0, 0, oc.width, oc.height);
              octx2.setTransform(1, 0, 0, 1, 0, 0);
              octx2.clearRect(0, 0, oc2.width, oc2.height);

              image.src = imageSource + '?t=' + new Date().getTime();
            };
          }

          image.onload = async function () {
              /* Resize Image */
              const ratioFit = calculateAspectRatioFit(image.width, image.height, netInWidth, netInHeight);
              oc.width = ratioFit.width;
              oc.height = ratioFit.height;
              octx.drawImage(image, 0, 0, oc.width, oc.height);
              octx2.drawImage(oc, 0, 0, ratioFit.width, ratioFit.height, 0, 0, ratioFit.width, ratioFit.height);
              /* Image Resized */
              // do predict
              const imageTensor = await tf.browser.fromPixels(oc2);
              const results = await yolov2.predictAndRender(imageTensor, canvas, {
                userThreshold: threshold,
                image: image,
                inputSize: [oc.height, oc.width],
              });
              // dynamic canvas width
              canvas.style = "width:100%;";
              // call callback function
              showResults(results);
              if (fn) requestAnimationFrame(fn);
          };
          image.src = imageSource;
        } else if (imageSource.search(/^ws.*/) >= 0) {
          throw new Error('WS is not supported');
        } else {
          throw new Error('Your input source dose not supported');
        }

        return this;
      }
    }
  })();
}(window, window.document));
