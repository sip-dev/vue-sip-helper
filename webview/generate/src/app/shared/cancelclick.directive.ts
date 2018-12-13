import { Directive, ElementRef, Input, OnDestroy } from '@angular/core';
        
@Directive({
    selector: '[sipCancelclick]'
})
export class CancelclickDirective implements OnDestroy {

    constructor(private _eleRef:ElementRef) {
        this._eleRef.nativeElement.addEventListener('click',this.click);
    }

    @Input() sipCancelclick = false;

    click =  (e:MouseEvent)=>{
        e.stopPropagation();
        return false;
    }
    
    ngOnDestroy(){
        this._eleRef.nativeElement.removeEventListener('click',this.click);
    }
    

}
