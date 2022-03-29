const studentsTextarea = document.querySelector('.student-ids');
const executeButton = document.querySelector('.action.action-execute');

studentsTextarea.addEventListener('input', event => {
  const removeAnyWhitespaceRegex = /\s+/gm;
  const currentValue = event.target.value;
  event.target.value = currentValue.replace(removeAnyWhitespaceRegex, '\n');
})

executeButton.addEventListener('click', _ => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { students: studentsTextarea.value }, function (response) {
      console.log('Response', response);
    });
  });
});
