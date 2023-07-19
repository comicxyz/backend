module.exports = {
  filter(data) {
    return true; // log everything
  },
  output: {
    path: "request.log", // name of file
    isJson: false, // will not format JSON
    options: {
      path: "logs/", // path to write files to
      size: "10M", // max file size
      rotate: 5 // keep 5 rotated logs
    }
  }
}