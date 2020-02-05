Blockly.JavaScript['yolov2_predict_image_2'] = function(block) {
  var value_model_url = Blockly.JavaScript.valueToCode(block, 'model_url', Blockly.JavaScript.ORDER_ATOMIC);
  var value_input = Blockly.JavaScript.valueToCode(block, 'input', Blockly.JavaScript.ORDER_ATOMIC);
  var value_threshold = Blockly.JavaScript.valueToCode(block, 'threshold', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'await _yolov2_.init(' + value_model_url + ', ' + value_input + ', ' + value_threshold +');\n';
  return code;
};

Blockly.JavaScript['yolov2_callback2'] = function(block) {
  var idx = Blockly.JavaScript.valueToCode(block, 'idx', Blockly.JavaScript.ORDER_ATOMIC);
  var statements_yolov2_obj = Blockly.JavaScript.statementToCode(block, 'yolov2_obj');
  var code = '_yolov2_.onLabel(' + idx + ', async function(idx, _yolov2Returns_){\n';
  code += statements_yolov2_obj + '\n';
  code += '});\n';
  return code;
};

Blockly.JavaScript['yolov2_dataVal'] = function (block) {
  var code = '_yolov2Returns_';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['yolov2_amount'] = function (block) {
  var code = '_yolov2Returns_ && _yolov2Returns_.length || 0';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['yolov2_objName'] = function (block) {
  var code = 'idx';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['yolov2_camera_input'] = function(block) {
  var dropdown_name = block.getFieldValue('NAME');
  var dropdown_name2 = block.getFieldValue('NAME2');
  var output = JSON.stringify({
    source: 'webcam_' + dropdown_name,
    resolution: dropdown_name2,
  })
  var code = '\'' + output + '\'';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['yolov2_modelLabels'] = function (block) {
  var code = '_yolov2_.getLabels()';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['yolov2_getobjconfidence'] = function(block) {
  var variable_cb_returns = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('cb_returns'), Blockly.Variables.NAME_TYPE);
  var value_name = Blockly.JavaScript.valueToCode(block, 'results_index', Blockly.JavaScript.ORDER_ATOMIC);
  var code = variable_cb_returns + ' && ' + variable_cb_returns + '[' + value_name + ' - 1].confidence';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['yolov2_getobjpositionX'] = function(block) {
  var variable_cb_returns = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('cb_returns'), Blockly.Variables.NAME_TYPE);
  var value_name = Blockly.JavaScript.valueToCode(block, 'results_index', Blockly.JavaScript.ORDER_ATOMIC);
  var code = variable_cb_returns + ' && _yolov2_.getBoxCenterPosition(' + variable_cb_returns + '[' + value_name + ' - 1]).x';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['yolov2_getobjpositionY'] = function(block) {
  var variable_cb_returns = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('cb_returns'), Blockly.Variables.NAME_TYPE);
  var value_name = Blockly.JavaScript.valueToCode(block, 'results_index', Blockly.JavaScript.ORDER_ATOMIC);
  var code = variable_cb_returns + ' && _yolov2_.getBoxCenterPosition(' + variable_cb_returns + '[' + value_name + ' - 1]).y';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['yolov2_allResults'] = function (block) {
  var code = '_yolov2_.getResults()';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['yolov2_getSpecificResults'] = function (block) {
  var value_name = Blockly.JavaScript.valueToCode(block, 'label', Blockly.JavaScript.ORDER_ATOMIC);
  var code = '_yolov2_.getResults(' + value_name + ')';
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['yolov2_stop'] = function(block) {
  var code = '_yolov2_.stop();\n';
  return code;
};

Blockly.JavaScript['yolov2_doPredict'] = function(block) {
  var code = 'await _yolov2_.start();\n';
  return code;
};

Blockly.JavaScript['yolov2_setthreshold'] = function(block) {
  var value_name = Blockly.JavaScript.valueToCode(block, 'NAME', Blockly.JavaScript.ORDER_ATOMIC);
  var code = '_yolov2_.setThreshold(' + value_name + ');\n';
  return code;
};
