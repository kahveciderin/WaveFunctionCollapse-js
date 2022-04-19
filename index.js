const GRID_SIZE = 4;

const findCommonElement = (array1, array2) => {
    for (let i = 0; i < array1.length; i++) {
        for (let j = 0; j < array2.length; j++) {
            if (array1[i] === array2[j]) {
                return true;
            }
        }
    }
    return false;
}

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
        this.cellEntropy = [...Array(GRID_SIZE * GRID_SIZE).keys()]
            .map(() => [...Array(this.cellPool.length).keys()])
    }

    /**
     * @name findCellWithLowestEntropy
     * @description Finds the cell with the lowest entropy
     * 
     * @returns {number} index of one of the cells with the lowest entropy
     */
    findCellWithLowestEntropy() {
        let lowestEntropy = Infinity;
        let entropyRandomness = {}
        for (let i = 0; i < this.cellEntropy.length; i++) {
            const entropy = this.cellEntropy[i].length
            if (entropy < lowestEntropy) {
                lowestEntropy = entropy;
                entropyRandomness = {}
                entropyRandomness[i] = this.placedCells[i].random
            } else if (entropy === lowestEntropy) {
                entropyRandomness[i] = this.placedCells[i].random
            }
        }
        const lowestEntropyIndex = Object.keys(entropyRandomness).sort((a, b) => entropyRandomness[a] - entropyRandomness[b])[0]
        return lowestEntropyIndex;
    }

    tryDecideCell(cellIndex) {
        // console.log("cell entropies:", this.cellEntropy)
        const randomDecision = this.placedCells[cellIndex].getRandom(this.cellEntropy[cellIndex].length)
        // console.log("random decision:", randomDecision)
        // console.log("ce length", this.cellEntropy[cellIndex].length)
        const cellType = this.cellEntropy[cellIndex][randomDecision]
        this.cellEntropy[cellIndex] = cellType // do not try overwriting this cell on the next pass, so destroy the array and instead put the id. this is also going to be used in constraints to check if the cell is allowed
        console.log("placing cell:", cellType, "at", cellIndex)
        this.cellEntropy.forEach((entropies, index) => {
            if (!Array.isArray(entropies)) return
            entropies.forEach(entropy => {
                const isAllowed = this.constraints[entropy].check(index, this.cellEntropy)
                console.log("checking constraint", this.constraints[entropy], "at", index, "is allowed:", isAllowed)
                if (!isAllowed) {
                    this.cellEntropy[index] = this.cellEntropy[index].filter(e => e !== entropy)
                }
            })
        }) // this is O(n^3). BAD!
        console.log("cell entropies:", JSON.stringify(this.cellEntropy))
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
            // console.log("trying", i)
            const cellIndex = this.findCellWithLowestEntropy()
            // console.log("found cell with lowest entropy:", cellIndex)
            const decidedCell = this.tryDecideCell(cellIndex)
            // console.log("decided cell:", decidedCell)
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

        const leftCellFits = Array.isArray(leftCell) ? findCommonElement(leftCell, this.allowedNeighbors) : this.allowedNeighbors.includes(leftCell)
        const rightCellFits = Array.isArray(rightCell) ? findCommonElement(rightCell, this.allowedNeighbors) : this.allowedNeighbors.includes(rightCell)
        const upCellFits = Array.isArray(upCell) ? findCommonElement(upCell, this.allowedNeighbors) : this.allowedNeighbors.includes(upCell)
        const downCellFits = Array.isArray(downCell) ? findCommonElement(downCell, this.allowedNeighbors) : this.allowedNeighbors.includes(downCell)

        return leftCellFits && rightCellFits && upCellFits && downCellFits
    }
}

const wfc = new WaveFunctionCollapse([
    new Cell('#ff0000'),
    new Cell('#7f7f00'),
    new Cell('#00ff00'),
    new Cell('#007f7f'),
    new Cell('#0000ff'),
    new Cell('#7f007f'),
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