const debug = true;


if (debug) console.log('Popup');
const studentsTextarea = document.querySelector('.student-ids');
const setAbsentCheckbox = document.querySelector('#auto-absent');
const regexText = document.querySelector("#regex");
const executeButton = document.querySelector('.action.action-execute');
if (debug) console.log('students raw', studentsTextarea.value, 'test');
if (debug) console.log('regex raw', regexText.value, 'test');

chrome.storage.sync.get(['studentNrs'], function (result) {
  if (debug) console.log('Value currently is ' + result);
  studentsTextarea.value = result.studentNrs;
});

executeButton.addEventListener('click', event => {

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      students: studentsTextarea.value,
      setAbsent: setAbsentCheckbox.checked,
      regex: regexText.value.trim()
    }, function (response) {
      if (debug) console.log('Response', response);
    });
  });
});


studentsTextarea.addEventListener("input", (event) => {
  chrome.storage.sync.set({ 'studentNrs': studentsTextarea.value }, function () {
    if (debug) console.log('Value is set to ' + studentsTextarea.value);
  });

 


});