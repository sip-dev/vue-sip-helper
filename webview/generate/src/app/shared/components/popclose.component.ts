import { Component, Input, OnDestroy } from '@angular/core';
        
@Component({
    selector: 'sip-popclose',
    template:'',
    styles:[]
})
export class PopcloseComponent implements OnDestroy {

	constructor() {
        document.documentElement.addEventListener('click',this.bodyclick);
    }



    bodyclick = (e)=>{
        if (this.pops && this.pops.length > 0 ){
            this.pops.forEach((p)=>{
                p._elementRef.nativeElement != e.target && p.isOpen() && p.close();
            });
        }
    }

    ngOnDestroy(){
        document.documentElement.removeEventListener('click',this.bodyclick);
    }
    
    @Input() pops:any[];

}
