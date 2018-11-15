import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {CodemirrorModule} from '@ctrl/ngx-codemirror';

import {AppComponent} from './app.component';
import {HttpClientModule} from "@angular/common/http";

import 'codemirror/mode/htmlmixed/htmlmixed';
import {EditorComponent} from './components/editor/editor.component';
import {RouterModule} from "@angular/router";
import {routes} from './app.routing';
import {HomeComponent, SafeHtmlPipe} from './components/home/home.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ToastrModule} from "ngx-toastr";

@NgModule({
    declarations: [
        AppComponent,
        SafeHtmlPipe,
        EditorComponent,
        HomeComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        CodemirrorModule,
        RouterModule.forRoot(routes),
        BrowserAnimationsModule,
        ToastrModule.forRoot()
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
