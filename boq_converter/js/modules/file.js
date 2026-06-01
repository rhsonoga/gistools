export function openFilePicker(fileInput) {
  if (fileInput) {
    fileInput.click();
  }
}

export function getFirstSelectedFile(event) {
  const files = event?.target?.files;
  if (files && files.length > 0) {
    return files[0];
  }

  const dragFiles = event?.dataTransfer?.files;
  if (dragFiles && dragFiles.length > 0) {
    return dragFiles[0];
  }

  return null;
}
