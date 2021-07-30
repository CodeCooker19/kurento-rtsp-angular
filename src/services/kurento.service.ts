import { ElementRef, Injectable, OnDestroy, Output } from '@angular/core';
import * as kurentoUtils from 'kurento-utils';
import { BehaviorSubject, Subscription } from 'rxjs';

import { WebsocketService } from './websocket.service';

export interface KurentoServiceConfig {
  cameraURL: string;
  webSocketUrl: string;
  videoComponent: ElementRef;
}

export enum VideoStatus {
  Loading,
  Play,
  Stop
}

declare var kurentoClient: any;

@Injectable()
export class KurentoService implements OnDestroy {

  @Output()
  public status: BehaviorSubject<VideoStatus> = new BehaviorSubject(VideoStatus.Stop);

  protected cameraURL: string;
  protected webSocketUrl: string;
  protected video: any;
  protected pipeline: any;  
  protected webRtcPeer: any;
  protected wsSubscription: Subscription;

  constructor(protected wsService: WebsocketService) { }

  public ngOnDestroy(): void {
    this.wsSubscription.unsubscribe();
  }

  public configure(config: KurentoServiceConfig): void {
    this.cameraURL = config.cameraURL;
    this.webSocketUrl = config.webSocketUrl;
    this.video = config.videoComponent.nativeElement;
  }

  public start(): void {
    this.status.next(VideoStatus.Loading);

    const options = {
      remoteVideo: this.video
    };

    this.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
      error => {
        if (error) {
          return this.onError(error);
        }
        console.log(">>>>>>>WebRtcPeerRecvonly", error)
        this.webRtcPeer.generateOffer((a, b) => this.onOffer(a, b));
      });
  }

  public onOffer(error, sdpOffer): void {
    if (error) {
      return console.error('Error generating the offer');
    }
    console.log(">>>>>>>onOffer", this.webSocketUrl, this.cameraURL)

    // kurentoClient.KurentoClient(this.webSocketUrl)
    new kurentoClient(this.webSocketUrl)
      .then((client) => {
        client.create("MediaPipeline")
          .then((p) => {
            this.pipeline = p;
            this.pipeline.create("PlayerEndpoint", {uri: this.cameraURL})
              .then((player) => {
                this.pipeline.create("WebRtcEndpoint")
                  .then((webRtcEndpoint) => {
                    this.setIceCandidateCallbacks(webRtcEndpoint, this.webRtcPeer, this.onError);
                    webRtcEndpoint.processOffer(sdpOffer)
                      .then((sdpAnswer) => {
                        webRtcEndpoint.gatherCandidates(this.onError);
                        this.webRtcPeer.processAnswer(sdpAnswer);
                      })
                      .catch((error) => {
                        this.onError(error);
                      })
                    player.connect(webRtcEndpoint)
                      .then(() => {
                        console.log("PlayerEndpoint-->WebRtcEndpoint connection established");
                        player.play()
                          .then(() => {
                            console.log("Player playing ...");
                            this.status.next(VideoStatus.Play);
                          })
                          .catch((error) => {
                            this.onError(error);
                          })
                      })
                      .catch((error) => {
                        this.onError(error);
                      })
                  })
                  .catch((error) => {
                    this.onError(error);
                  })
              })
              .catch((error) => {
                this.onError(error);
              })
          })
          .catch((error) => {
            this.onError(error);
          })
      })
      .catch((error) => {
        this.onError(error);
      })
  }

  public playEnd(): void {
    this.status.next(VideoStatus.Stop);
  }

  public onError(error): void {
    if(error) {
      console.error(error);
      this.playEnd();
    }
  }

  public setIceCandidateCallbacks(webRtcEndpoint, webRtcPeer, onError): void {
    webRtcPeer.on('icecandidate', function(candidate){
      console.log("Local icecandidate " + JSON.stringify(candidate));
  
      candidate = kurentoClient.register.complexTypes.IceCandidate(candidate);
  
      webRtcEndpoint.addIceCandidate(candidate, onError);
  
    });
    webRtcEndpoint.on('OnIceCandidate', function(event){
      var candidate = event.candidate;
  
      console.log("Remote icecandidate " + JSON.stringify(candidate));
  
      webRtcPeer.addIceCandidate(candidate, onError);
    });
  }
}
