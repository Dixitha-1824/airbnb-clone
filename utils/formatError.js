function formatMongooseError(err) {
  if (err.name !== "ValidationError") {
    return ["Something went wrong. Please try again."];
  }

  return Object.values(err.errors).map(e => e.message);
}

module.exports = formatMongooseError;
