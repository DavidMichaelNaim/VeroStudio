/**
 * @fileoverview CommandManager class executing commands and maintaining undo/redo stacks.
 */

/**
 * @interface Command
 * @property {string} name - Descriptive name of the command.
 * @property {function(import('./app-state.js').AppState): void} execute - Runs the action and mutates the state.
 * @property {function(import('./app-state.js').AppState): void} undo - Reverts the changes made by execute.
 */

export class CommandManager {
  /**
   * @param {import('./app-state.js').AppState} appState - The application state store to mutate.
   * @param {number} [maxDepth=100] - Maximum capacity of undo stack.
   */
  constructor(appState, maxDepth = 100) {
    /** @type {import('./app-state.js').AppState} */
    this.appState = appState;
    /** @type {number} */
    this.maxDepth = maxDepth;
    /** @type {Command[]} */
    this.undoStack = [];
    /** @type {Command[]} */
    this.redoStack = [];
  }

  /**
   * Executes a command, registers it in the undo stack, and clears the redo stack.
   * @param {Command} command - The command instance to execute.
   */
  execute(command) {
    try {
      command.execute(this.appState);
      this.undoStack.push(command);
      
      // Enforce history stack limit
      if (this.undoStack.length > this.maxDepth) {
        this.undoStack.shift();
      }

      this.redoStack = []; // Reset redo stack on new action
      this.appState.emit('history', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
    } catch (err) {
      console.error(`Command execution failed: ${command.name}`, err);
    }
  }

  /**
   * Reverts the most recent command on the undo stack.
   */
  undo() {
    if (!this.canUndo()) return;

    const command = this.undoStack.pop();
    try {
      command.undo(this.appState);
      this.redoStack.push(command);
      this.appState.emit('history', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
    } catch (err) {
      console.error(`Command undo failed: ${command.name}`, err);
      // Put it back to avoid corrupting history stack state
      this.undoStack.push(command);
    }
  }

  /**
   * Re-executes the most recently reverted command on the redo stack.
   */
  redo() {
    if (!this.canRedo()) return;

    const command = this.redoStack.pop();
    try {
      command.execute(this.appState);
      this.undoStack.push(command);
      this.appState.emit('history', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
    } catch (err) {
      console.error(`Command redo failed: ${command.name}`, err);
      // Put it back
      this.redoStack.push(command);
    }
  }

  /**
   * Checks if undo is possible.
   * @returns {boolean} True if there is a command that can be reverted.
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Checks if redo is possible.
   * @returns {boolean} True if there is a command that can be re-applied.
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Clears the transaction history stacks.
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.appState.emit('history', {
      canUndo: false,
      canRedo: false
    });
  }
}
