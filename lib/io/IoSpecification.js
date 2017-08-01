'use strict';

const Debug = require('debug');

module.exports = function IoSpecification(ioSpecification, parentContext) {
  const id = ioSpecification.id;
  const type = ioSpecification.$type;
  const debug = Debug(`bpmn-engine:io:${type.toLowerCase()}`);
  const dataObjects = parentContext.dataObjects;

  const {dataInputs, dataOutputs} = ioSpecification;
  const {inputSet, outputSet} = parentContext.getActivityIOReferences(ioSpecification);

  const input = InputParameters();
  const output = OutputParameters();

  return {
    id,
    type,
    getInput,
    getOutput,
    save,
    setResult
  };

  function getInput() {
    debug(`<${id}> get input`);
    return input.get();
  }

  function getOutput() {
    debug(`<${id}> get output`);

    return output.get();
  }

  function save() {
    output.saveToEnvironment();
  }

  function setResult(value) {
    output.set(value);
  }

  function InputParameters() {
    const parms = init();

    return {
      get
    };

    function get() {
      if (!parms) return;

      return parms.reduce((result, parm) => {
        const invalue = parm.getInputValue();
        if (invalue !== undefined) {
          result[parm.name] = invalue;
        }
        return result;
      }, {});
    }

    function init() {
      if (!inputSet) {
        return dataInputs.map((parm) => DataReference(parm, dataObjects));
      }

      return inputSet && inputSet.map((inset) => {
        return DataReference(dataInputs.find((parm) => parm.id === inset.id), dataObjects);
      });
    }
  }

  function OutputParameters() {
    const parms = init();

    return {
      get,
      saveToEnvironment,
      set
    };

    function set(value) {
      if (parms.length === 1) parms[0].set(value);
      if (!value || !value.hasOwnProperty) return;

      parms.forEach((parm) => {
        if (value.hasOwnProperty(parm.name)) {
          parm.set(value[parm.name]);
        }
      });
    }

    function get() {
      if (!parms) return;

      return parms.reduce((result, parm) => {
        const value = parm.get();
        if (value !== undefined) {
          result[parm.id] = value;
        }
        return result;
      }, {});
    }

    function saveToEnvironment() {
      parms.forEach((parm) => {
        parm.save();
      });
    }

    function init() {
      if (!outputSet) {
        return dataOutputs.map((parm) => DataReference(parm, dataObjects));
      }

      return outputSet.map((outset) => {
        return DataReference(dataOutputs.find((parm) => parm.id === outset.id), dataObjects);
      });
    }
  }
};


function DataReference(parm, dataObjects) {
  const id = parm.id;
  const type = parm.$type;
  const name = parm.name;
  let resultData;

  return {
    id,
    type,
    name,
    save,
    getInputValue,
    set,
    get
  };

  function getInputValue() {
    return dataObjects.getActivityInputValue(id);
  }

  function save() {
    const dataObject = dataObjects.getDataObject(id);
    if (dataObject) dataObject.save(get());
  }

  function get() {
    return resultData;
  }

  function set(value) {
    resultData = value;
  }
}