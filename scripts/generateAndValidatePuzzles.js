/**
 * Brain Spark - Sudoku Puzzle Generator & Validator
 * 
 * Bu script 90 adet (30 Kolay, 30 Orta, 30 Zor) Sudoku bulmacası üretir,
 * tek çözümlü (unique solution) olduklarını doğrular ve `puzzles.json` dosyasına kaydeder.
 * 
 * Zorluk Kriterleri (Verilen İpucu Sayısına Göre Yaklaşık):
 * - Kolay (Easy)  : 45 - 50 ipucu
 * - Orta (Medium) : 31 - 35 ipucu
 * - Zor (Hard)    : 24 - 28 ipucu
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Sudoku Solver & Helpers ──────────────────────────────────────────────────

function getRow(cell) { return Math.floor(cell / 9) }
function getCol(cell) { return cell % 9 }
function getBlock(cell) { return Math.floor(getRow(cell) / 3) * 3 + Math.floor(getCol(cell) / 3) }

// Hızlı validation için helper
function isValid(board, cell, value) {
    const r = getRow(cell)
    const c = getCol(cell)
    const b = getBlock(cell)

    for (let i = 0; i < 81; i++) {
        if (i !== cell && board[i] === value) {
            if (getRow(i) === r || getCol(i) === c || getBlock(i) === b) {
                return false
            }
        }
    }
    return true
}

// Fisher-Yates shuffle
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
}

// ─── Generator & Uniqueness Checker ──────────────────────────────────────────

/** Tamamen dolu ve rastgele geçerli bir Sudoku tahtası üretir */
function generateFullBoard() {
    const board = Array(81).fill(0)

    function fill(cell) {
        if (cell === 81) return true
        if (board[cell] !== 0) return fill(cell + 1)

        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const num of nums) {
            if (isValid(board, cell, num)) {
                board[cell] = num
                if (fill(cell + 1)) return true
                board[cell] = 0 // backtrack
            }
        }
        return false
    }

    fill(0)
    return board
}

/** 
 * Verilen board'un tam olarak 1 tane mi çözümü var?
 * limitsiz solver ile 2 çözüm bulduğumuz an false döneriz (optimizasyon).
 */
function hasUniqueSolution(board) {
    let solutions = 0

    function solve(cell) {
        if (cell === 81) {
            solutions++
            return
        }
        if (board[cell] !== 0) {
            solve(cell + 1)
            return
        }

        for (let num = 1; num <= 9; num++) {
            if (isValid(board, cell, num)) {
                board[cell] = num
                solve(cell + 1)
                if (solutions > 1) {
                    board[cell] = 0
                    return // Birden fazla çözüm var, aramayı kes
                }
                board[cell] = 0 // backtrack
            }
        }
    }

    solve(0)
    return solutions === 1
}

/** İstenilen ipucu (clue) sayısına kadar hücreleri boşaltır */
function digHoles(fullBoard, targetClues) {
    let board = [...fullBoard]
    let cells = shuffle(Array.from({ length: 81 }, (_, i) => i))
    let clues = 81

    for (const cell of cells) {
        if (clues <= targetClues) break

        const backup = board[cell]
        board[cell] = 0

        // Eğer hücreyi silince tek çözüm bozuluyorsa, geri koy
        if (!hasUniqueSolution(board)) {
            board[cell] = backup
        } else {
            clues--
        }
    }
    return board
}

// ─── Puzzle Üretim Fabrikası ────────────────────────────────────────────────

function generatePuzzle(id, difficulty, targetClues) {
    // 1. Tam dolu bir çözüm tahtası oluştur
    const solutionBoard = generateFullBoard()

    // 2. Rastgele simetrik/asimetrik kazıyarak hedef ipucu sayısına in (Tek çözümü koruyarak)
    const initialBoard = digHoles(solutionBoard, targetClues)

    return {
        id,
        difficulty,
        initialBoard,
        solutionBoard
    }
}

function run() {
    console.log('⏳ Brain Spark - 90 Bulmaca üretiliyor (Lütfen bekleyin, tek çözümlülük test ediliyor)...')

    const puzzles = []
    const difficulties = [
        { level: 'easy', count: 30, minClues: 45, maxClues: 50 },
        { level: 'medium', count: 30, minClues: 31, maxClues: 35 },
        { level: 'hard', count: 30, minClues: 24, maxClues: 28 }
    ]

    for (const diff of difficulties) {
        console.log(`\n🧩 Üretiliyor: ${diff.level.toUpperCase()} (${diff.count} adet)`)

        for (let i = 1; i <= diff.count; i++) {
            const id = `${diff.level}_${i.toString().padStart(3, '0')}`
            // Hedef ipucu aralığında rastgele bir değer seç
            const target = Math.floor(Math.random() * (diff.maxClues - diff.minClues + 1)) + diff.minClues

            const puzzle = generatePuzzle(id, diff.level, target)
            puzzles.push(puzzle)
            process.stdout.write('.') // İlerleme göstergesi
        }
    }

    // Çıktıyı kaydet
    const dirPath = path.join(__dirname, '../src/constants')
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }

    const filePath = path.join(dirPath, 'puzzles.json')
    fs.writeFileSync(filePath, JSON.stringify({ puzzles }, null, 2))

    console.log(`\n\n✅ 90 bulmaca başarıyla üretildi! Dosya: ${filePath}`)

    // ─── VALIDATION (PROMPT 5 İsteri) ───────────────────────────────────────
    console.log('\n🔍 Validation Başlıyor...')
    let allValid = true

    puzzles.forEach(p => {
        // 1. Kurallar ihlal edilmiş mi?
        for (let i = 0; i < 81; i++) {
            if (p.initialBoard[i] !== 0 && !isValid(p.initialBoard, i, p.initialBoard[i])) {
                console.error(`❌ Hata: ${p.id} - initialBoard kuralları ihlal ediyor.`)
                allValid = false
            }
            if (!isValid(p.solutionBoard, i, p.solutionBoard[i])) {
                console.error(`❌ Hata: ${p.id} - solutionBoard kuralları ihlal ediyor.`)
                allValid = false
            }
        }

        // 2. initialBoard çözümle uyuşuyor mu?
        for (let i = 0; i < 81; i++) {
            if (p.initialBoard[i] !== 0 && p.initialBoard[i] !== p.solutionBoard[i]) {
                console.error(`❌ Hata: ${p.id} - initialBoard ve solutionBoard uyuşmazlığı.`)
                allValid = false
            }
        }

        // 3. Tek çözüm var mı?
        if (!hasUniqueSolution(p.initialBoard)) {
            console.error(`❌ Hata: ${p.id} - Tek ve benzersiz bir çözümü YOK!`)
            allValid = false
        }
    })

    if (allValid) {
        console.log('✅ All 90 puzzles valid. (Hepsi tek çözümlü ve kurallara uygun)\n')
    } else {
        console.error('❌ Validation başarısız oldu.')
        process.exit(1)
    }
}

run()
