if (!String.prototype.format) {
  String.prototype.format = function() {
    let args = arguments;
    return this.replace(/{(\d+)}/g, (match, number) => (
      typeof args[number] != 'undefined' ? args[number] : match
    ));
  }
};
