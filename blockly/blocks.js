Blockly.Blocks['yolov2_predict_image'] = {
  init: function() {
    this.appendValueInput("input")
        .setCheck("String")
        .appendField(Blockly.Msg.YoloV2_ImageInput);
    this.appendValueInput("model_url")
        .setCheck("String")
        .appendField(Blockly.Msg.YoloV2_ModelUrl);
    this.appendValueInput("threshold")
        .setCheck("Number")
        .appendField(Blockly.Msg.YoloV2_Threshold);
    this.setOutput(true, null);
    this.setColour(230);
    this.setTooltip("yolov2");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['yolov2_predict_image_2'] = {
  init: function() {
    this.appendValueInput("input")
        .setCheck("String")
        .appendField(Blockly.Msg.YoloV2_ImageInput);
    this.appendValueInput("model_url")
        .setCheck("String")
        .appendField(Blockly.Msg.YoloV2_ModelUrl);
    this.appendValueInput("threshold")
        .setCheck("Number")
        .appendField(Blockly.Msg.YoloV2_Threshold);
    this.setOutput(false, null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("yolov2");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['yolov2_callback'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable("yolov2Detector"), "NAME");
    this.appendValueInput("idx")
        .setCheck("String")
        .appendField(Blockly.Msg.YoloV2_If1);
    this.appendDummyInput()
        .appendField(Blockly.Msg.YoloV2_If1_Then);
    this.appendStatementInput("yolov2_obj")
        .setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['yolov2_callback2'] = {
  init: function() {
    this.appendValueInput("idx")
        .setCheck("String")
        .appendField(Blockly.Msg.YoloV2_If1);
    this.appendDummyInput()
        .appendField(Blockly.Msg.YoloV2_If1_Then);
    this.appendStatementInput("yolov2_obj")
        .setCheck(null);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['yolov2_dataVal'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(Blockly.Msg.YoloV2_Received);
    this.setOutput(true, "Array");
    this.setColour(45);
 this.setTooltip("");
 this.setToolUrl("");
  }
};

Blockly.Blocks['yolov2_amount'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(Blockly.Msg.YoloV2_ObjAmount);
    this.setOutput(true, "Number");
    this.setColour(45);
 this.setTooltip("");
 this.setToolUrl("");
  }
};

Blockly.Blocks['yolov2_objName'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(Blockly.Msg.YoloV2_ObjName);
    this.setOutput(true, "String");
    this.setColour(45);
 this.setTooltip("");
 this.setToolUrl("");
  }
};

Blockly.Blocks['yolov2_camera_input'] = {
  init: function() {
    let res = [
      ['320x240', '320x240'],
      ['640x480', '640x480'],
      ['800x600', '800x600'],
      ['1280x720', '1280x720'],
      ['1920x1080', '1920x1080'],
    ];

    this.appendDummyInput()
        .appendField(Blockly.Msg.YoloV2_Camera)
        .appendField(new Blockly.FieldDropdown(this.generateOptions), "NAME")
        .appendField(Blockly.Msg.YoloV2_Camera_Resolution)
        .appendField(new Blockly.FieldDropdown(res), "NAME2");

    this.setOutput(true, "String");
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  },

  generateOptions: function() {
    (async function getCameras() {
      let devices = [];
      let deviceInfos = await navigator.mediaDevices.enumerateDevices();
      for (var i = 0; i !== deviceInfos.length; ++i) {
        var deviceInfo = deviceInfos[i];
        if (deviceInfo.kind === 'videoinput') {
          devices.push([deviceInfo.label, deviceInfo.deviceId]);
        }
      }
      window.yolov2Cameras = devices;
    })();

    let list = [
      [Blockly.Msg.YoloV2_Camera_Auto, 'auto'],
      [Blockly.Msg.YoloV2_Camera_MRear, 'mobile_rear'],
      [Blockly.Msg.YoloV2_Camera_MFront, 'mobile_front'],
    ];

    if (!window.yolov2Cameras) {
      return list;
    } else {
      return list.concat(window.yolov2Cameras);
    }
  }
};

Blockly.Blocks['yolov2_modelLabels'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(Blockly.Msg.YoloV2_AllLabels);
    this.setOutput(true, "String");
    this.setColour(230);
    this.setTooltip("");
    this.setToolUrl("");
  }
};

Blockly.Blocks['yolov2_getobjconfidence'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.YoloV2_ObjValFrom1)
        .appendField(new Blockly.FieldVariable("yolov2Returns"), "cb_returns")
        .appendField(Blockly.Msg.YoloV2_ObjValFrom2);
    this.appendValueInput("results_index")
        .setCheck(null);
    this.appendDummyInput()
        .appendField(Blockly.Msg.YoloV2_ObjValConfidence);
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['yolov2_getobjpositionX'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.YoloV2_ObjValFrom1)
        .appendField(new Blockly.FieldVariable("yolov2Returns"), "cb_returns")
        .appendField(Blockly.Msg.YoloV2_ObjValFrom2);
    this.appendValueInput("results_index")
        .setCheck(null);
    this.appendDummyInput()
        .appendField(Blockly.Msg.YoloV2_ObjValPosX);
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['yolov2_getobjpositionY'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.YoloV2_ObjValFrom1)
        .appendField(new Blockly.FieldVariable("yolov2Returns"), "cb_returns")
        .appendField(Blockly.Msg.YoloV2_ObjValFrom2);
    this.appendValueInput("results_index")
        .setCheck(null);
    this.appendDummyInput()
        .appendField(Blockly.Msg.YoloV2_ObjValPosY);
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['yolov2_allResults'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.YoloV2_AllResults);
    this.setOutput(true, null);
    this.setColour(230);
    this.setTooltip("");
    this.setToolUrl("");
  }
};

Blockly.Blocks['yolov2_getSpecificResults'] = {
  init: function() {
    // this.appendDummyInput()
    //     .appendField(Blockly.Msg.YoloV2_SpecificResults);
    this.appendValueInput("label")
        .appendField(Blockly.Msg.YoloV2_SpecificResults)
        .setCheck(null);
    this.setInputsInline(false);
    this.setOutput(true, "Number");
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['yolov2_stop'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.YoloV2_Stop);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['yolov2_doPredict'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.YoloV2_Start);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['yolov2_setthreshold'] = {
  init: function() {
    this.appendValueInput("NAME")
        .setCheck("Number")
        .appendField(Blockly.Msg.YoloV2_SetThreshold);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};
