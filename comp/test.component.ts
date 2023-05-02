import {HttpClient, HttpParams} from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter, Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import moment from 'moment';
import {BehaviorSubject, EMPTY, lastValueFrom, Observable, of, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/operators';
import {Clinic} from 'src/app/common/models/clinic/clinic.model';
import {environment} from 'src/environments/environment';

import { SysSecuredActionsEnum } from 'src/app/common/enums/sys-secured-actions.enum';
import { ChartNote } from '../../common/models/chart-notes/chart-note.model';
import { RelatedItem } from '../../common/models/related-item.model';


@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly dynamicContainerId: number;

  subscription: Subscription = new Subscription();
  public pdfLoadingSubject = new BehaviorSubject<boolean>(true);
  pdfLoading$ = this.pdfLoadingSubject.asObservable().pipe(distinctUntilChanged());
  clinic: Clinic = JSON.parse(localStorage.getItem('clinic'));
  base64: string;
  public document = '';
  moment = moment;
  clientNotes: ChartNote[];
  isReview = false;
  viewerFormGroup: FormGroup;
  currentIndex: number;
  chartNoteDropdown: ChartNote[];
  caseDropdown: RelatedItem[];
  practitionerDropdown: RelatedItem[];

  constructor(
    private http: HttpClient,
    private ref: ChangeDetectorRef,
    private translateService: TranslateService,
  ) {
    // defaultOptions.workerSrc = '/assets/pdf.worker-es5.js';
  }

  ngAfterViewInit(): void {
  }

  ngOnInit(): void {

  }


  onCloseClick(): void {

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
