const Yup = require('yup');

function generateSchema() {
  return Yup.object().shape({
"applications": Yup.object().shape({
"$application": Yup.lazy(() => Yup.object().shape({
"name": Yup.string().required('This field is required').min(10, 'Need at least 10 characters'),
"description": Yup.object().shape({
}),
"features": Yup.object().shape({
"$feature": Yup.lazy(() => Yup.object().shape({
"name": Yup.object().shape({
}),
"enabled": Yup.boolean(),
})),
}),
})),
}),
"meta": Yup.object().shape({
}),
});
}

module.exports = generateSchema;