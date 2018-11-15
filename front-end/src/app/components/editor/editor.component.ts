import {AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ToastrService} from "ngx-toastr";
import {environment} from "../../../environments/environment";

@Component({
    selector: 'app-editor',
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit, AfterViewInit {

    @ViewChild('codeMirror') codeMirrorRef;
    @ViewChild('confirmBtn') confirmBtnRef;

    timer;
    loading: boolean = true;
    nextUpdate: number;
    html: string;
    codeMirrorOutput: string;
    cursorLine: number = 1;
    cursorColumn: number = 5;
    originalLineNumber: number;
    displayChoiceOverlay: boolean = false;

    listenForEvents: boolean = true;

    selectedCursorPosition;
    deleteChoice: boolean = false;
    keyChoice;

    secondsLeft: number;
    refreshRate: number;

    extraKeys = {
        'Enter': function(cm) {
            cm.replaceSelection("\n" ,"end");
        }
    };

    constructor(private http: HttpClient,
                private cd: ChangeDetectorRef,
                private toastr: ToastrService) {
    }

    ngOnInit() {
        this.http.get(environment.api_base_url + '/', {responseType: 'text' as 'text'}).subscribe(res => {
            this.loading = false;
            this.html = res;
            this.codeMirrorRef.codeMirror.getDoc().setValue(this.html);
            this.codeMirrorRef.codeMirror.getDoc().markClean();
            this.originalLineNumber = this.codeMirrorRef.codeMirror.lineCount();
        }, err => {
            this.loading = false;
            this.toastr.error('A technical error occurred.', null, {
                positionClass: 'toast-bottom-left'
            });
            console.error(err);
        });

        this.http.get(environment.api_base_url + '/nextUpdate').subscribe((res: any) => {
            this.loading = false;
            this.nextUpdate = res.data.nextUpdate + 1;
            this.refreshRate = res.data.refreshRate;
            this.updateTimeLeft();
            this.timer = setInterval(this.updateTimeLeft.bind(this), 1000);
        }, err => {
            this.loading = false;
            this.toastr.error('A technical error occurred.', null, {
                positionClass: 'toast-bottom-left'
            });
            console.error(err);
        });
    }

    ngOnDestroy() {
        clearInterval(this.timer);
    }

    ngAfterViewInit() {
        const codeMirror = this.codeMirrorRef.codeMirror;
        codeMirror.setSize('100%', '100%');
        codeMirror.on('keyup', this.keyEvent.bind(this));
    }

    keyEvent(codeMirror, event) {
        // check if we are listening for key presses
        if (this.listenForEvents) {

            // exclude the arrow keys
            if (!event.key.toLowerCase().includes('arrow')) {

                if (event.key === 'Backspace' || event.key === 'Delete') {
                    // delete a character or move a line
                    this.handleDeleteEvent(codeMirror);
                } else if (event.key === 'Enter') {
                    // split or create a line
                    this.handleEnterEvent(codeMirror);
                } else if (event.key.length === 1) { // poor handling of character keys to ignore special keys...
                    // write a character
                    this.handleCharacterEvent(codeMirror, event);
                }
            }
        }
    }

    focusConfirmButton() {
        const codeMirror = this.codeMirrorRef.codeMirror;
        codeMirror.setOption('readOnly', true);
        this.confirmBtnRef.nativeElement.focus();
        this.cd.detectChanges();
    }

    handleDeleteEvent(codeMirror) {
        const cursor =  codeMirror.getCursor();

        // exit if the backspace is done at the first line and the first column
        if (cursor.line === 0 && cursor.ch === 0 && codeMirror.getDoc().isClean()) {
            return;
        }

        this.deleteChoice = true;

        if (this.lineRemoved()) {
            // line removal or moved one level above
            this.cursorLine = cursor.line + 2;
            this.cursorColumn = 0;
        } else {
            // remove a character
            this.cursorLine = cursor.line + 1;
            this.cursorColumn = cursor.ch + 1;
        }

        this.displayChoiceOverlay = true;
        this.listenForEvents = false;
        this.focusConfirmButton();
        this.cd.detectChanges();
    }

    handleCharacterEvent(codeMirror, event) {
        const cursor =  codeMirror.getCursor();

        this.keyChoice = true;

        if (event.key === ' ') {
            this.keyChoice = 'Spacebar';
        } else {
            this.keyChoice = event.key;
        }

        this.cursorLine = cursor.line + 1;
        this.cursorColumn = cursor.ch - 1;

        this.displayChoiceOverlay = true;
        this.listenForEvents = false;
        this.focusConfirmButton();
        this.cd.detectChanges();
    }

    handleEnterEvent(codeMirror) {
        const cursor =  codeMirror.getCursor();

        this.keyChoice = 'Enter';

        const editorLines = this.codeMirrorRef.codeMirror.getValue().split(/\r?\n/);

        if (editorLines[cursor.line] === '') {
            // create a new line
            this.cursorColumn = editorLines[cursor.line - 1].length;
            this.cursorLine = cursor.line;
        } else if (editorLines[cursor.line - 1] === '') {
            // create an empty line
            this.cursorColumn = 0;
            this.cursorLine = cursor.line;
        } else {
            // split a line
            const previousLine = editorLines[cursor.line - 1];

            this.cursorColumn = previousLine.length;
            this.cursorLine = cursor.line;
        }

        this.displayChoiceOverlay = true;
        this.listenForEvents = false;
        this.focusConfirmButton();
        this.cd.detectChanges();
    }

    cancel() {
        this.selectedCursorPosition = null;
        this.deleteChoice = false;
        this.keyChoice = null;
        this.displayChoiceOverlay = false;
        const codeMirror = this.codeMirrorRef.codeMirror;
        codeMirror.getDoc().setValue(this.html);
        this.codeMirrorRef.codeMirror.getDoc().markClean();
        codeMirror.setOption('readOnly', false);
        codeMirror.focus();
        this.listenForEvents = true;
    }

    confirm() {
        this.loading = true;

        let type;

        if (this.deleteChoice) {
            type = 'DELETE';
        } else {
            type = 'WRITE';
        }

        const body = {
            type: type,
            value: this.keyChoice,
            row: this.cursorLine,
            column: this.cursorColumn
        };

        this.http.post(environment.api_base_url + '/code', body).subscribe((res: any) => {
            this.toastr.success(res.message, 'Code submitted', {
                positionClass: 'toast-bottom-left'
            });

            this.selectedCursorPosition = null;
            this.deleteChoice = false;
            this.keyChoice = null;
            this.displayChoiceOverlay = false;
            const codeMirror = this.codeMirrorRef.codeMirror;
            codeMirror.focus();

            this.loading = false;
        }, err => {
            this.loading = false;
            this.toastr.error(err.message, 'Error', {
                positionClass: 'toast-bottom-left'
            });
        });
    }

    lineRemoved(): boolean {
        const editorLineNumber = this.codeMirrorRef.codeMirror.lineCount();
        return editorLineNumber === this.originalLineNumber - 1;
    }

    updateTimeLeft() {
        const currentTime = Math.floor((+ new Date()) / 1000);
        this.secondsLeft = this.nextUpdate - currentTime;
        if (this.secondsLeft <= 0) {
            this.nextUpdate += this.refreshRate;
            this.refreshEditor();
        }
    }

    refreshEditor() {
        this.loading = true;
        this.http.get(environment.api_base_url + '/', {responseType: 'text' as 'text'}).subscribe(res => {
            this.html = res;
            this.codeMirrorRef.codeMirror.getDoc().setValue(this.html);
            this.codeMirrorRef.codeMirror.getDoc().markClean();
            this.originalLineNumber = this.codeMirrorRef.codeMirror.lineCount();

            this.selectedCursorPosition = null;
            this.deleteChoice = false;
            this.keyChoice = null;
            this.displayChoiceOverlay = false;

            const codeMirror = this.codeMirrorRef.codeMirror;
            codeMirror.setOption('readOnly', false);
            codeMirror.focus();
            this.listenForEvents = true;
            this.loading = false;
        }, err => {
            this.loading = false;
            this.toastr.error('A technical error occurred.', null, {
                positionClass: 'toast-bottom-left'
            });
            console.error(err);
        });
    }
}

