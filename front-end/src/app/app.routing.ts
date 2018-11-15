import {Routes} from '@angular/router';
import {EditorComponent} from "./components/editor/editor.component";
import {HomeComponent} from "./components/home/home.component";

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: HomeComponent
    },
    {
        path: 'editor',
        component: EditorComponent
    }
];
