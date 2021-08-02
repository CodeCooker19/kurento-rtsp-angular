import { AfterViewInit, Component, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { KurentoService, VideoStatus } from '../../services/kurento.service';

@Component({
  selector: 'app-kurento-video',
  templateUrl: './kurento-video.component.html',
  styleUrls: ['./kurento-video.component.scss'],
  providers: [KurentoService],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.app-kurento-video]': 'true'
  }
})
export class KurentoVideoComponent implements AfterViewInit {
  @Input('camera')
  public cameraURL: string;
  @Input('websocket')
  public webSocketUrl: string;

  protected loadingSub: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public loading$ = this.loadingSub.asObservable();

  @ViewChild('video')
  protected video: ElementRef;

  @ViewChild('camerasource')
  protected camerasource: ElementRef;
  

  constructor(
    protected kurentoService: KurentoService
  ) { }

  public ngAfterViewInit(): void {
    this.kurentoService.configure({
      cameraURL: this.cameraURL,
      webSocketUrl: this.webSocketUrl,
      videoComponent: this.video
    });
    this.kurentoService.status.subscribe(status => {
      if (VideoStatus.Loading === status) {
        this.loadingSub.next(true);
      } else {
        this.loadingSub.next(false);
      }
    });
  }

  public play(): void {
    let url = this.camerasource.nativeElement.value === "" ? this.cameraURL : this.camerasource.nativeElement.value;
    this.kurentoService.configure({
      cameraURL: url,
      webSocketUrl: this.webSocketUrl,
      videoComponent: this.video
    });
    this.kurentoService.start();
  }

  public stop(): void {
    this.kurentoService.stop();
  }
}
