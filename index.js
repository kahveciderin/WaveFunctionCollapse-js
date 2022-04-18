const GRID_SIZE = 16;


class Cell{
    
}

class WaveFunctionCollapse{

}

window.addEventListener('load', () => {
    for(let i = 0; i < GRID_SIZE; i++){
        let previewRow = document.createElement('div');
        previewRow.classList.add('preview-row');
        previewRow.style.backgroundColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        for(let j = 0; j < GRID_SIZE; j++){
            let previewCell = document.createElement('div');
            previewCell.classList.add('preview-cell');
            previewCell.style.backgroundColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
            previewRow.appendChild(previewCell);
        }
        document.querySelector('.preview-pane').appendChild(previewRow);
    }
})