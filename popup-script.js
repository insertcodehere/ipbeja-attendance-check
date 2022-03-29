console.log('Popup');
const studentsTextarea = document.querySelector('.student-ids');
const executeButton = document.querySelector('.action.action-execute');
console.log('students raw', studentsTextarea.value, 'test');

executeButton.addEventListener('click', event => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { students: studentsTextarea.value }, function (response) {
      console.log('Response', response);
    });
  });
});
