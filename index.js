const GRID_SIZE = 16;

const getRelativeCell = (grid, index, x, y) => {
    let rel_x = x + (index % GRID_SIZE);
    let rel_y = y + Math.floor(index / GRID_SIZE);
    if (rel_x < 0) {
        rel_x += GRID_SIZE;
    }
    if (rel_y < 0) {
        rel_y += GRID_SIZE;
    }
    if (rel_x >= GRID_SIZE) {
        rel_x -= GRID_SIZE;
    }
    if (rel_y >= GRID_SIZE) {
        rel_y -= GRID_SIZE;
    }
    return grid[index + x + y * GRID_SIZE];
}

class Cell {
    constructor(color) {
        this.color = color
    }
}

class PlacedCell {
    constructor(cellDOM) {
        this.cellDOM = cellDOM;
        this.cell = null;
        this.random = Math.random()
    }
    getRandom(max) {
        return Math.floor(this.random * max);
    }
    updateCell() {
        this.cellDOM.style.backgroundColor = this.cell.color;
    }
}

class WaveFunctionCollapse {
    constructor(cellPool, constraints) {
        this.cellPool = cellPool;
        this.constraints = constraints;
        this.placedCells = [];
        this.cellEntropy = []
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            this.cellEntropy.push([])
            for (let j = 0; j < this.cellPool.length; j++) {
                this.cellEntropy[i].push(j)
            }
        }
    }

    findCellWithLowestEntropy() {
        let lowestEntropy = Infinity;
        let lowestEntropyIndex = -1;
        for (let i = 0; i < this.cellEntropy.length; i++) {
            const entropy = this.cellEntropy[i].length
            if (entropy < lowestEntropy) {
                lowestEntropy = entropy;
                lowestEntropyIndex = i;
            }
        }
        return lowestEntropyIndex;
    }

    tryDecideCell() {
        const cellStart = this.findCellWithLowestEntropy()
        const cellType = this.cellPool[Math.floor(this.cellEntropy[cellStart].random * this.cellEntropy[cellStart].length)]
        this.cellEntropy.forEach((entropies, index) => {

            entropies.forEach(entropy => {
                const isAllowed = this.constraints[entropy].check(index, this.cellEntropy)
                if (!isAllowed) {
                    this.cellEntropy[index] = this.cellEntropy[index].filter(e => e !== entropy)
                }
            })

        }) // this is O(n^3). BAD!
        return cellType
    }

    fill() {
        // this.placedCells = this.placedCells.map((cell, index) => {
        //     const cellRandom = cell.getRandom(this.cellPool.length)
        //     const decidedCell = this.cellPool[cellRandom]
        //     cell.cell = decidedCell
        //     cell.updateCell()
        //     return cell
        // })
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const cellIndex = this.findCellWithLowestEntropy()
            const decidedCell = this.tryDecideCell()
            this.placedCells[cellIndex].cell = this.cellPool[decidedCell]
            this.placedCells[cellIndex].updateCell()
        }
    }
}

class Constraint {
    constructor() {
    }
    check(index, gridArray) {
        return true;
    }
}
class NeighborConstraint extends Constraint {
    constructor(...allowedNeighbors) {
        super()
        this.allowedNeighbors = allowedNeighbors
    }
    check(index, gridArray) {
        const leftCell = getRelativeCell(gridArray, index, -1, 0)
        const rightCell = getRelativeCell(gridArray, index, 1, 0)
        const upCell = getRelativeCell(gridArray, index, 0, -1)
        const downCell = getRelativeCell(gridArray, index, 0, 1)

        return this.allowedNeighbors.includes(leftCell) ||
            this.allowedNeighbors.includes(rightCell) ||
            this.allowedNeighbors.includes(upCell) ||
            this.allowedNeighbors.includes(downCell)
    }
}

const wfc = new WaveFunctionCollapse([
    new Cell('#ff0000'),
    new Cell('#ffff00'),
    new Cell('#00ff00'),
    new Cell('#00ffff'),
    new Cell('#0000ff'),
    new Cell('#ff00ff'),
], {
    0: new NeighborConstraint(5, 0, 1),
    1: new NeighborConstraint(0, 1, 2),
    2: new NeighborConstraint(1, 2, 3),
    3: new NeighborConstraint(2, 3, 4),
    4: new NeighborConstraint(3, 4, 5),
    5: new NeighborConstraint(4, 5, 0),
})


window.addEventListener('load', () => {
    for (let i = 0; i < GRID_SIZE; i++) {
        let previewRow = document.createElement('div');
        previewRow.classList.add('preview-row');
        for (let j = 0; j < GRID_SIZE; j++) {
            let previewCell = document.createElement('div');
            previewCell.classList.add('preview-cell');
            wfc.placedCells.push(new PlacedCell(previewCell));
            previewRow.appendChild(previewCell);
        }
        document.querySelector('.preview-pane').appendChild(previewRow);
    }

    wfc.fill()
})