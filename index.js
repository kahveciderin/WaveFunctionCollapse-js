const GRID_SIZE = 4;
const RANDOM_PLACEMENT = true // is placement random for cells with the same entropy

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
    return grid[rel_x + rel_y * GRID_SIZE];
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
        // return Math.floor((this.random * max * max) % max);
        return Math.floor(Math.random() * max);
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
        this.counter = 0
    }

    /**
     * @name findCellWithLowestEntropy
     * @description Finds the cell with the lowest entropy
     * 
     * @returns {number} index of one of the cells with the lowest entropy
     */
    findCellWithLowestEntropy(isRandom) {
        if(isRandom) {
            const entropyList = this.placedCells.map((e, i) => [i, e]).filter(cell => !cell[0].cell)
            console.log("entropyList", entropyList.map(a=>a))
            const randomIndex = Math.floor(Math.random() * entropyList.length)
            const randomEntropy = entropyList[randomIndex][0]
            return randomEntropy
        }
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
        if (RANDOM_PLACEMENT) return Object.keys(entropyRandomness).sort((a, b) => entropyRandomness[a] - entropyRandomness[b])[0]
        return Object.keys(entropyRandomness)[0]
    }

    tryDecideCell(cellIndex) {
        if (!Array.isArray(this.cellEntropy[cellIndex])) return this.cellEntropy[cellIndex]
        const randomDecision = this.placedCells[cellIndex].getRandom(this.cellEntropy[cellIndex].length)
        const cellType = this.cellEntropy[cellIndex][randomDecision]
        this.cellEntropy[cellIndex] = cellType // do not try overwriting this cell on the next pass, so destroy the array and instead put the id. this is also going to be used in constraints to check if the cell is allowed
        const cellEntropyClone = []
        this.cellEntropy.forEach((entropies, index) => {
            if (!Array.isArray(entropies)) return cellEntropyClone.push(entropies)
            const entropyClone = []
            entropies.forEach(entropy => {
                const constraintToCheck = this.constraints[entropy] || new NoConstraint()
                const isAllowed = constraintToCheck.check(index, this.cellEntropy)
                if (isAllowed) {
                    entropyClone.push(entropy)
                } else {
                    // this.cellEntropy[index] = this.cellEntropy[index].filter(e => e !== entropy)
                }
            })
            cellEntropyClone.push(entropyClone)
        }) // this is O(n^3). BAD!
        this.cellEntropy = cellEntropyClone
        return cellType
    }
    placeOne(callback) {
        if (this.counter >= GRID_SIZE * GRID_SIZE) return
        this.counter++
        let cellIndex = this.findCellWithLowestEntropy(this.counter < GRID_SIZE * 2)
        let decidedCell = undefined
        // console.log("cellIndex", cellIndex)
        // console.log("cellEntropy", this.cellEntropy)
        let timeout = 0
        let timeoutCounter = 0
        while (decidedCell === undefined) {
            if (timeout > 8) {
                cellIndex = this.findCellWithLowestEntropy(this.counter < GRID_SIZE * 2)
                console.log("TIMEOUT cellIndex", cellIndex)
                timeout = 0
                timeoutCounter++
            }
            if (timeoutCounter > 8) {
                break
            }
            timeout++
            decidedCell = this.tryDecideCell(cellIndex)
        }
        // console.log("decidedCell", decidedCell)
        this.placedCells[cellIndex].cell = this.cellPool[decidedCell]
        this.placedCells[cellIndex].updateCell()
        console.log("placed cell #", this.counter)
        if (callback) {
            callback()
        }
    }
    fill() {
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            this.placeOne()
        }
    }
    print() {
        const _print = () => {
            this.placeOne(() => {
                setTimeout(_print, 0)
            })
        }
        _print()
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
        const leftUpCell = getRelativeCell(gridArray, index, -1, -1)
        const rightUpCell = getRelativeCell(gridArray, index, 1, -1)
        const leftDownCell = getRelativeCell(gridArray, index, -1, 1)
        const rightDownCell = getRelativeCell(gridArray, index, 1, 1)
        const neighbors = [leftCell, rightCell, upCell, downCell, leftUpCell, rightUpCell, leftDownCell, rightDownCell]
        const fits = neighbors.reduce((accum, neigh) => accum &&
            (Array.isArray(neigh) ?
                /* findCommonElement(neigh, this.allowedNeighbors) */ true :
                this.allowedNeighbors.includes(neigh)), true)

        return fits
    }
}
class NoConstraint extends Constraint {
    constructor() {
        super()
    }
    check(index, gridArray) {
        return true
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
    wfc.print()
    // document.querySelector('.place-next button').addEventListener('click', () => {
    //     wfc.placeOne()
    // })

})