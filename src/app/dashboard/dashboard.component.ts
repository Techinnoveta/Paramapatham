import {
  Component, Input, ElementRef, AfterViewInit, ViewChild, OnInit
} from '@angular/core';
import { fromEvent } from 'rxjs';
import { switchMap, takeUntil, pairwise } from 'rxjs/operators'
import * as Tesseract from '../../../node_modules/tesseract.js'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  ngOnInit() {
  }

  title = 'ezDocPad';
  @ViewChild('canvas') public canvas: ElementRef;

  // setting a width and height for the canvas
  @Input() public width = 800;
  @Input() public height = 800;

  private cx: CanvasRenderingContext2D;  
  
  public ngAfterViewInit() {
    // get the context
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasEl.getContext('2d');

    // set the width and height
    canvasEl.width = this.width;
    canvasEl.height = this.height;

    // set some default properties about the line
    this.cx.lineWidth = 3;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#000';
    
    // we'll implement this method to start capturing mouse events
    this.captureEvents(canvasEl);
    
  }

  private captureEvents(canvasEl: HTMLCanvasElement) {
    // this will capture all mousedown events from the canvas element
    fromEvent(canvasEl, 'mousedown')
      .pipe(
        switchMap((e) => {
          // after a mouse down, we'll record all mouse moves
          return fromEvent(canvasEl, 'mousemove')
            .pipe(
              // we'll stop (and unsubscribe) once the user releases the mouse
              // this will trigger a 'mouseup' event    
              takeUntil(fromEvent(canvasEl, 'mouseup')),
              // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
              takeUntil(fromEvent(canvasEl, 'mouseleave')),
              // pairwise lets us get the previous value to draw a line from
              // the previous point to the current point    
              pairwise()
            )
        })
      )
      .subscribe((res: [MouseEvent, MouseEvent]) => {
        const rect = canvasEl.getBoundingClientRect();
  
        // previous and current position with the offset
        const prevPos = {
          x: res[0].clientX - rect.left,
          y: res[0].clientY - rect.top
        };
  
        const currentPos = {
          x: res[1].clientX - rect.left,
          y: res[1].clientY - rect.top
        };
  
        // this method we'll implement soon to do the actual drawing
        this.drawOnCanvas(prevPos, currentPos);
        let src = this.cx.getImageData(0, 0, canvasEl.width, canvasEl.height)

        Tesseract.recognize(src)
        .progress(message => console.log(message))
        .catch(err => console.error(err))
        .then(result => console.log(result))
        .finally(resultOrError => console.log(resultOrError))
      });
  }

  private drawOnCanvas(prevPos: { x: number, y: number }, currentPos: { x: number, y: number }) {
    if (!this.cx) { return; }

    this.cx.beginPath();

    if (prevPos) {
      this.cx.moveTo(prevPos.x, prevPos.y); // from
      this.cx.lineTo(currentPos.x, currentPos.y);
      this.cx.stroke();
    }
  }
}
