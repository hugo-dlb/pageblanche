import {Component, OnDestroy, OnInit, Pipe} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {DomSanitizer} from "@angular/platform-browser";
import {ToastrService} from "ngx-toastr";
import {environment} from "../../../environments/environment";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {

    timer;
    html: string;

    constructor(private http: HttpClient,
                private toastr: ToastrService) {
    }

    ngOnInit() {
        this.refreshPage();
        this.http.get(environment.api_base_url + '/nextUpdate').subscribe((res: any) => {
            this.timer = setInterval(this.refreshPage.bind(this), res.data.refreshRate * 1000);
        }, err => {
            this.toastr.error('A technical error occurred.', null, {
                positionClass: 'toast-bottom-left'
            });
            console.error(err);
        });
    }

    ngOnDestroy() {
        clearInterval(this.timer);
    }

    refreshPage() {
        this.http.get(environment.api_base_url + '/', {responseType: 'text' as 'text'}).subscribe(res => {
            this.html = res;
        }, err => {
            this.toastr.error('A technical error occurred.', null, {
                positionClass: 'toast-bottom-left'
            });
            console.error(err);
        });
    }
}

@Pipe({name: 'safeHtml'})
export class SafeHtmlPipe {
    constructor(private sanitizer: DomSanitizer) {
    }

    transform(style) {
        return this.sanitizer.bypassSecurityTrustHtml(style);
    }
}
