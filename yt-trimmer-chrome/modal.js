/* Function which initialises the modal element showing trimmed entries. */
function initModal() {
  let modalElem = document.createElement('div');

  modalElem.id        = 'trim-modal';
  modalElem.className = 'modal';
  modalElem.innerHTML = //
    `
      <div class="modal-content">
          <div class="modal-body">
              <p>Fetching trimmed list, please wait...</p>
          </div>
      </div>
    `;

  document.body.appendChild(modalElem);
}

/* Function which updates modal listing all trimmed entries. */
function updateModalContent() {
  let list      = [];
  let modalElem = document.getElementById('trim-modal');

  for (let key in dict) {
    let listEntry = dict[key].concat(key);
    list.push(listEntry);
  }

  list.sort(function(a, b) {
    if (a[2].toLowerCase() > b[2].toLowerCase()) return 1;
    else if (a[2].toLowerCase() < b[2].toLowerCase()) return -1;
    else return 0;
  });

  for (let i = 0; i < list.length; i ++) {
    let entryString = '<'
  }
}
