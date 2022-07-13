# IPBeja Attendance Check Extension
Google Chrome extension to mark student attendance at IPBeja University.

## Installation
1. Visit the [releases](https://github.com/insertcodehere/ipbeja-attendance-check/releases) page and download the desired extension version.
2. Extract the extension downloaded (zip file)
3. Open the chrome extensions tab (write in the URL bar `chrome://extensions`).
4. Activate developer mode.
5. Click on the button "Load unpacked".
6. Select the folder with the extracted content of the extension.

## Usage notes
**Option 1**
1. Open the IPBeja student attendance portal page, select a summary and open the student attendance dialog.
5. Write or paste the student numbers into the textarea. To detect that it is working correctly, we highlight the student numbers using a regex expression that can be changed in the settings.
6. Press the button "Execute" and wait until the progress bar reaches 100%.

**Option 2**
1. Open the IPBeja student attendance portal page, select a summary and open the student attendance dialog.
2. Click on the tab "File".
3. Drag a CMS moodle XLSX file into the drop zone or click the drop zone to open a file picker dialog.
7. Select the day of the class to create the attendance check.
8. Select which attendance states are to be considered as valid attendance.
9. Press the button "Execute" and wait until the progress bar reaches 100%.

## Features
- Student attendance from textarea
- Student attendance from CMS moodle XLSX file
- Custom regex expressions for the textarea extraction
- Auto-save attendance has completed
- Mark student absence
