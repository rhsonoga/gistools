export function openFilePicker(fileInput) {
  if (fileInput) {
    fileInput.click();
  }
}

export function getFirstSelectedFile(event) {
  return event.target.files && event.target.files[0] ? event.target.files[0] : null;
}