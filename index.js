window.addEventListener('load', () => {
    for(let i = 0; i < 5; i++){
        let previewRow = document.createElement('div');
        previewRow.classList.add('preview-row');
        previewRow.style.backgroundColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        for(let j = 0; j < 5; j++){
            let previewCell = document.createElement('div');
            previewCell.classList.add('preview-cell');
            previewCell.style.backgroundColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
            previewRow.appendChild(previewCell);
        }
        document.querySelector('.preview-pane').appendChild(previewRow);
    }
})