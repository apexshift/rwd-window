import file_loader from '../../file-loader.json' with { type: 'json' };

const parseFileLoader = () => {
    if(!file_loader.files.length) {
      console.warn('File loader config is empty.');
      return false;
    }
    return file_loader.files;
}

export const populateFilesSelect = () => {
  if(false === parseFileLoader()) return;
  
  const file_array = parseFileLoader();
  const select = document.getElementById('file-loader');
  if(!select) return console.error('File loader select element not found.');

  select.innerHTML = file_array.map(file => `<option value="${file.value}" title="${file.value}">${file.label}</option>`).join('');

  select.addEventListener('change', handleFileSelectChange);
}

const handleFileSelectChange = (event) => {
  const selectedValue = event.target.value;
  const iframe = document.getElementById('viewport-target');
  if(!iframe) return console.error('Main iframe element not found.');
  
  iframe.src = selectedValue;
}

export const initIFrameSrc = () => {
  const iframe = document.getElementById('viewport-target');
  if(!iframe) return console.error('Main iframe element not found.');
  
  iframe.src = parseFileLoader()[0].value;
}