'use babel';

import LinterWastView from './linter-wast-view';
import { CompositeDisposable } from 'atom';
import { parse } from 'wast-parser';

export default {

    linterWastView: null,
    modalPanel: null,
    subscriptions: null,

    activate(state) {
        this.linterWastView = new LinterWastView(state.linterWastViewState);
        this.modalPanel = atom.workspace.addModalPanel({
            item: this.linterWastView.getElement(),
            visible: false
        });

        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable();

        // Register command that toggles this view
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'linter-wast:toggle': () => this.toggle()
        }));
    },

    deactivate() {
        this.modalPanel.destroy();
        this.subscriptions.dispose();
        this.linterWastView.destroy();
    },

    serialize() {
        return {
            linterWastViewState: this.linterWastView.serialize()
        };
    },

    toggle() {
        return (
            this.modalPanel.isVisible() ?
            this.modalPanel.hide() :
            this.modalPanel.show()
        );
    },

    provideLinter() {
        return {
            name: 'wast',
            scope: 'file', // or 'project'
            lintsOnChange: false, // or true
            grammarScopes: ['source.wast'],
            lint(textEditor) {
                const editorPath = textEditor.getPath()
                try {
                    parse(textEditor.getText());
                } catch (parseErr) {
                    const loc = parseErr.location;
                    const start = loc.start;
                    const end = loc.end;
                    return [{
                        severity: 'error',
                        location: {
                            file: editorPath,
                            position: [
                                [start.line - 1, start.column],
                                [end.line - 1, end.column]
                            ],
                        },
                        excerpt: parseErr.message,
                        description: parseErr.stack
                    }];
                }
                return [];
            }
        };
    }

};
