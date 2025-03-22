function generateYupSchemaCode(definition) {
  function parseDefinition(def) {
    if (typeof def !== 'object' || def === null) return '';

    return `Yup.lazy((values = {}) =>
      Yup.object(
        Object.entries(values).reduce((schema, [key, value]) => {
          ${Object.entries(def)
            .map(([key, value]) => {
              if (key.startsWith('$')) {
                // Handle dynamic keys generically by detecting the $ prefix
                const dynamicKey = key.slice(1);
                const innerSchema = parseDefinition(value);
                return `
                if (key.startsWith('${dynamicKey}')) {
                  schema[key] = Yup.object().shape({
                    ${Object.entries(value)
                      .map(([innerKey, innerValue]) => `${innerKey}: ${getYupType(innerValue)}`)
                      .join(',\n')}
                  }).default({});
                }`;
              } else if (typeof value === 'object' && value !== null && !value._$_) {
                // Handle nested objects recursively
                return `schema['${key}'] = ${parseDefinition(value)};`;
              } else {
                // Handle primitive types
                return value._$_?`schema['${key}'] = ${getYupType(value)};`:`schema['${key}'] - no field definiton object provided`;
              }
            })
            .join('\n')}
          return schema;
        }, {})
      ).default({})
    )`;
  }

  function getYupType(value) {
    switch (typeof value.type) {
      case 'string':
        return ['Yup.string()',...generateValidations(value, YUP_STRING)].join(".");
      case 'number':
        return ['Yup.number().optional()',...generateValidations(value, YUP_NUMBER)].join(".");
      case 'boolean':
        return ['Yup.boolean().optional()',...generateValidations(value, YUP_BOOLEAN)].join(".");
      case 'date':
        return ['Yup.date()',...generateValidations(value, YUP_DATE)].join(".");
      case 'array':
        return ['Yup.date()',...generateValidations(value, YUP_ARRAY)].join("."); 
      default:
        return 'Yup.mixed().optional()';
    }
  }

  function generateValidations(value, vaildator){

    
    return value.validations.map(validation=>{
      console.log(YUP_MIX[validation])
          if(YUP_MIX[validation]){
         
             return YUP_MIX[validation];
          }else{
             if(vaildator[validation]) 
              return vaildator[validation];
          }
    })
    

  }

  const YUP_STRING = {
    "min": "min(limit, [message])", //  – Minimum length.
    "max": "max(limit, [message])",//  – Maximum length.
    "matches": "matches(regex, [message])",//  – Requires the string to match a regex pattern.
    "email": "email([message])",//  – Validates email format.
    "url": "url([message])",//  – Validates URL format.
    "uuid": "uuid([message])",//  – Validates a UUID (v4).
    "trim": "trim([message])",//  – Ensures no whitespace at the start or end of the string.
    "lowercase": "lowercase([message])",//  – Converts the string to lowercase.
    "uppercase": "uppercase([message])"// – Converts the string to uppercase.

  }

  const YUP_MIX = {
    "required": "required()",     // Requires a non-null value.
    "notRequired": "notRequired()",  //Allows a nullable or undefined value.
    "nullable": "nullable()",     // Allows null values.
    "defined": "defined()",      //Requires a defined (non-undefined) value.
    "oneOf": "oneOf([values], [message])",     // Requires the value to be one of the specified values.
    "notOneOf": "notOneOf([values], [message]",  // Requires the value to not be one of the specified values.
    "equals": "equals([values], [message])",   // Ensures the value equals one of the provided values.
    "when": "when(key, options)",             // Conditionally applies validation based on another key’s value.
    "transform": "transform((value, originalValue) => newValue)",  // Transforms the value before validation
  }

  const YUP_NUMBER = {
    "min": "min(limit, [message])", //  – Minimum value.
    "max": "max(limit, [message])", //  – Maximum value.
    "lessThan": "lessThan(limit, [message])", //  – Less than a specified value.
    "moreThan": "moreThan(limit, [message])", //  – More than a specified value.
    "positive": "positive([message])", //  – Positive numbers only.
    "negative": "negative([message])", //  – Negative numbers only.
    "integer": "integer([message])", //  – Integers only.

  }

  const YUP_BOOLEAN = {
    "oneOf": "oneOf([true], [message])" // – Requires a specific boolean value (usually true or false).
  }

  const YUP_DATE = {
    "min": "min(limit, [message])", // – Date must be after the specified date.
    "max": "max(limit, [message])" // – Date must be before the specified date.
  }

  const YUP_ARRAY = {
    "min": "min(limit, [message])", // – Date must be after the specified date.
    "max": "max(limit, [message])" // – Date must be before the specified date.
  }

  return `Yup.object().shape({ ${Object.keys(definition)
    .map((key) => `${key}: ${parseDefinition(definition[key])}`)
    .join(', ')} });`;
}

// Example Usage
const definition = {
  "fun":[],
  "applications": {
    "$application": {
      "name": {
        "_$_":true,
        "type": "string", //"type":"String, Number, Boolean, Date"
        "validations":[
          'required'
          ]
      },
      "size":{
        "$data":{
          "_$_":true,
          "type":"boolean",
          "validations":[
          'required'
          ]
        }
      }
    }
  },
  "meta":{
    "$data":{
      "enabled":{
        "_$_":true,
        "type": "number", //"type":"String, Number, Boolean, Date"
        "validations":[
          'required'
        ]
      }
    }
  }

};

const schemaCode = generateYupSchemaCode(definition);
console.log(schemaCode);
