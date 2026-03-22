import json

def validate_sudoku(board):
    if len(board) != 81:
        return False, "Board length is not 81"
    
    # Check rows
    for r in range(9):
        row = board[r*9 : (r+1)*9]
        if sorted(row) != list(range(1, 10)):
            return False, f"Row {r} failed"
            
    # Check columns
    for c in range(9):
        col = [board[r*9 + c] for r in range(9)]
        if sorted(col) != list(range(1, 10)):
            return False, f"Col {c} failed"
            
    # Check 3x3 blocks
    for br in range(3):
        for bc in range(3):
            block = []
            for r in range(br*3, (br+1)*3):
                for c in range(bc*3, (bc+1)*3):
                    block.append(board[r*9 + c])
            if sorted(block) != list(range(1, 10)):
                return False, f"Block {br},{bc} failed"
                
    return True, "OK"

def check_puzzles(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        puzzles = data.get('puzzles', [])
        print(f"Checking {len(puzzles)} puzzles...")
        
        errors = []
        for i, p in enumerate(puzzles):
            pid = p.get('id', f'unknown_{i}')
            initial = p.get('initialBoard', [])
            solution = p.get('solutionBoard', [])
            
            # 1. Length check
            if len(initial) != 81 or len(solution) != 81:
                errors.append(f"Puzzle {pid}: Invalid length (initial={len(initial)}, solution={len(solution)})")
                continue
                
            # 2. Match check
            for idx in range(81):
                if initial[idx] != 0 and initial[idx] != solution[idx]:
                    errors.append(f"Puzzle {pid}: Initial board doesn't match solution at index {idx}")
                    break
            
            # 3. Solution correctness
            is_valid, msg = validate_sudoku(solution)
            if not is_valid:
                errors.append(f"Puzzle {pid}: Solution is invalid - {msg}")
                
        if not errors:
            print("All puzzles are VALID!")
        else:
            print(f"FOUND {len(errors)} ERRORS:")
            for e in errors[:20]: # Show first 20
                print(f" - {e}")
            if len(errors) > 20:
                print(f" ... and {len(errors) - 20} more errors.")
                
    except Exception as e:
        print(f"Error reading file: {e}")

if __name__ == "__main__":
    check_puzzles('src/constants/puzzles.json')
