const studentsTextarea = document.querySelector('.student-ids');
const executeButton = document.querySelector('.action.action-execute');
const highlights = document.querySelector('.highlights');
const backdrop = document.querySelector('.backdrop');
const spinner = executeButton.querySelector('.spinner-border');


studentsTextarea.addEventListener('scroll', (event) => {
  debugger;
    var scrollTop = studentsTextarea.scrollTop;
    backdrop.scroll(0, scrollTop);
  }
);

window.addEventListener('load', _ => {
  // alert('Loaded');
});

window.addEventListener('beforeunload', _ => {
  // alert('Unloading');
});

studentsTextarea.addEventListener('input', event => {
  //const removeAnyWhitespaceRegex = /\s+/gm;
  const currentValue = event.target.value;
  const highlighted = applyHighlights(currentValue);
  highlights.innerHTML = highlighted;
  //event.target.value = currentValue.replace(removeAnyWhitespaceRegex, '\n');
});

studentsTextarea.addEventListener('blur', event => {
  // alert('Lost focus');
});

executeButton.addEventListener('click', _ => {
  executeButton.disabled = true;
  spinner.style.display = 'inline-block';
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let studentIds = studentsTextarea.value.match(/[1-9]\d{3,4}/gm);
    chrome.tabs.sendMessage(tabs[0].id, { students: studentIds }, function (response) {
      console.log('Response', response);
      executeButton.disabled = false;
      spinner.style.display = 'none';
    });
  });
});


function applyHighlights(text) {
  return text
    .replace(/\n$/g, '\n\n')
    .replace(/[1-9]\d{3,4}/gm, '<mark>$&</mark>');
}