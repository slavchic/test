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

import {ChartNoteStatusEnum} from '../../../common/enums/chart-note-status-enum';
import {AccessLevel} from '../../../common/enums/client-access-level.enum';
import {DocumentTypesEnum} from '../../../common/enums/document-types.enum';
import {ChartNoteSendEntity} from '../../../common/models/chart-notes/chart-note-send-entity.model';
import {ChartNote} from '../../../common/models/chart-notes/chart-note.model';
import {ChartNoteReportModel} from '../../../common/models/client-case/client-case.model';
import {ClientSummary} from '../../../common/models/client-profile/client-summary.model';
import {Client} from '../../../common/models/client-profile/client.model';
import {RelatedItem} from '../../../common/models/related-item.model';
import {ChartNoteService} from '../../../common/services/chart-note.service';
import {ClientHttpService} from '../../../common/services/client-http.service';
import {DialogHelperService} from '../../../common/services/dialog-helper.service';
import {getCurrentUser} from '../../../common/utils/auth.util';
import {UserRoleEnum} from '../../../modules/authentication/models/enums/user-role.enum';
import {DynamicConfig} from '../../../modules/dynamic-modules/dynamic-config';
import {DynamicLoaderService} from '../../../modules/dynamic-modules/dynamic-loader.service';
import {
  FaxChartDialogComponent
} from '../../../modules/dynamic-modules/entry-components/dialogs/fax-chart-dialog/fax-chart-dialog.component';
import * as fromRoot from '../../../store';
import {
  EmailChartDialogComponent
} from '../../../modules/dynamic-modules/entry-components/dialogs/email-chart-dialog/email-chart-dialog.component';
import {BackendConfig} from '../../../backend.config';
import {
  TaskDialogComponent
} from '../../../modules/dynamic-modules/entry-components/dialogs/task-dialog/task-dialog.component';
import {CmUser} from '../../../modules/authentication/models/user.model';
import notify from 'devextreme/ui/notify';
import {ActionsService} from '../../../common/services/actions.service';
import {EntityTypeEnum} from '../../../common/enums/entity-type.enum';
import {PspdfService} from "../../../common/services/pspdf.service";
import { SysSecuredActionsEnum } from 'src/app/common/enums/sys-secured-actions.enum';


@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly dynamicContainerId: number;

  @Output() closePopup = new EventEmitter<boolean>();
  @Output() updatedChartNote = new EventEmitter<ChartNote>();

  // Data to receive START
  @Input() disableEdit: boolean;
  @Input() disableActions: boolean;
  @Input() disableFax: boolean;
  @Input() srcUrl: string;
  @Input() selectedNote: ChartNote;
  @Input() selectedNoteReport: ChartNoteReportModel;
  @Input() isFullScreen = true;
  @Input() simpleActions = false;
  @Input() pdfTitle;
  @Input() pdfFile;
  @Input() isPhysiotech = false;
  @Input() createTaskAction = false;
  @Input() hideEditButton = false;
  @Input() hideActionsButton = false;

  @Input() isExplanationOfBenefits: boolean = false;
  @Input() clientCaseExplanationOfBenefitId: number = null;
  @Input() explanationOfBenefitsClientId: number = null;
  @Input() explanationOfBenefitsClientCaseId: number = null;
  // Data to receive END

  subscription: Subscription = new Subscription();
  public pdfLoadingSubject = new BehaviorSubject<boolean>(true);
  pdfLoading$ = this.pdfLoadingSubject.asObservable().pipe(distinctUntilChanged());
  portalUser: CmUser = getCurrentUser();
  clinic: Clinic = JSON.parse(localStorage.getItem('clinic'));
  curClient: Client;
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
  accessLevel = AccessLevel;
  chartNoteStatus = ChartNoteStatusEnum;
  isPractitioner: boolean;
  chartNoteEntities: ChartNoteSendEntity[] = [];
  docTypes = DocumentTypesEnum;
  language = localStorage.getItem('culture') || 'en-CA';
  clientSummaryInTheStore: ClientSummary;

  private get baseUrl(): string {
    return environment.production ? BackendConfig.cmApiUrl : environment.apiUrl;
  }

  private get fileApiUrl(): string {
    return environment.production ? BackendConfig.fileApiUrl : environment?.fileApiUrl;
  }

  constructor(
    private http: HttpClient,
    private ref: ChangeDetectorRef,
    private store: Store<fromRoot.State>,
    private translateService: TranslateService,
    private chartNoteService: ChartNoteService,
    private dynamicLoaderService: DynamicLoaderService,
    private dialogHelperService: DialogHelperService,
    private clientHttpService: ClientHttpService,
    private actionsService: ActionsService,
    private psPDFService: PspdfService
  ) {
    // defaultOptions.workerSrc = '/assets/pdf.worker-es5.js';
  }

  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
    this.subscription.add(
      this.store.pipe(select(fromRoot.getCurrentClientSummary))
        .subscribe(clientSummary => {
          this.clientSummaryInTheStore = {...clientSummary};
        })
    );
    this.subscription.add(this.psPDFService.documentPrinted.subscribe(p => {
      if(p === true) {
        this.afterPrintReport();
        console.log('Printed');
      }
    }));
    this.getPdf();
    this.getCurrentClient();
    this.isPractitioner = this.portalUser.sysEntityTypeId === EntityTypeEnum.Practitioner;
    if (this.selectedNote) {

      if (!this.pdfTitle) {
        this.pdfTitle = this.selectedNote.documentDescription;
      }
      if (this.selectedNote.documentType) {
        if (this.selectedNote.documentType.id === DocumentTypesEnum.Attachment) {
          this.hideEditButton = true;
        }
      }
      if (this.clientNotes) {
        this.fillFormGroup();
        if (this.isReview) {
          this.fillChartNoteDropdownByPractitioner(this.selectedNote.practitionerId);
          this.fillPractitionerDropdown();
          this.currentIndex = this.chartNoteDropdown && this.chartNoteDropdown.length > 0
            ? this.chartNoteDropdown.findIndex(chartNote => chartNote.chartNoteId === this.selectedNote.chartNoteId)
            : null;
        } else {
          this.fillChartNoteDropdownByCase(this.selectedNote.clientCaseId);
          this.fillCaseDropdown();
          this.currentIndex = this.chartNoteDropdown && this.chartNoteDropdown.length > 0
            ? this.chartNoteDropdown.findIndex(chartNote => chartNote.chartNoteId === this.selectedNote.chartNoteId)
            : null;
        }
        this.subscription.add(
          this.viewerFormGroup.get('chartNoteId').valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe(chartNoteId => {
            if (chartNoteId) {
              this.selectedNote = this.clientNotes.find(chartNote => chartNote.chartNoteId === chartNoteId);
              this.currentIndex = this.chartNoteDropdown.findIndex(chartNote => chartNote.chartNoteId === this.selectedNote.chartNoteId);
              this.document = this.clinic.clinicId + '/' + this.selectedNote.pdfURI;
              this.pdfTitle = this.selectedNote.documentDescription;
              this.ref.markForCheck();
            }
          })
        );
        this.subscription.add(
          this.viewerFormGroup.get('caseId').valueChanges.pipe(
            debounceTime(500), distinctUntilChanged()
          ).subscribe(caseId => {
            if (caseId) {
              this.fillChartNoteDropdownByCase(caseId);
              this.viewerFormGroup.get('chartNoteId').setValue(this.chartNoteDropdown[0].chartNoteId);
              this.currentIndex = 0;
              this.ref.markForCheck();
            }
          })
        );
        this.subscription.add(
          this.viewerFormGroup.get('practitionerId').valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged()
          ).subscribe(practitionerId => {
            if (practitionerId) {
              this.fillChartNoteDropdownByPractitioner(practitionerId);
              this.viewerFormGroup.get('chartNoteId').setValue(null);
              this.currentIndex = null;
              this.ref.markForCheck();
            }
          })
        );
      }
    }
  }

  getCurrentClient(): void {
   // const clientId = this.selectedNote? this.selectedNote.clientId : this.selectedNoteReport?.clientId;
   const clientId = this.selectedNote? this.selectedNote.clientId : (this.selectedNoteReport ? this.selectedNoteReport?.clientId : this.explanationOfBenefitsClientId);
    this.subscription.add(
      this.store.pipe(select(fromRoot.getCurrentClient)).pipe(switchMap(currClient => {
        this.curClient = currClient;
        if (this.curClient?.clientId === clientId) {
          return of(currClient);
        } else {
          return this.clientHttpService.getClient(clientId);
        }
      }))
        .subscribe((client: Client) => {
          this.curClient = client;
        })
    );
  }

  getPdf(): void {
    this.pdfLoadingSubject.next(true);

    if (this.selectedNote?.clientAccessLevel?.id === this.accessLevel.ReadWriteAccess) {
      this.subscription.add(
        this.dialogHelperService.confirmDialog(this.translateService.instant('confirm_messages.remove_write_access_from_the_client'))
          .subscribe(dialogResult => {
            if (dialogResult) {
              this.chartNoteService.updateChartNoteAccessLevel(this.selectedNote?.clientId, this.selectedNote?.chartNoteId, this.accessLevel.ReadAccess)
                .subscribe((note) => {
                  if (note) {
                    this.selectedNote.clientAccessLevel.id = note.clientAccessLevel?.id;
                    const successMessage = this.translateService.instant('confirm_messages.chartnote_access_level_changed');
                    notify({
                      message: successMessage,
                      type: 'success',
                      displayTime: 3000,
                      height: 50,
                      width: 500
                    });
                    this.updatedChartNote.emit(note);
                    this.ref.markForCheck();
                  }
                });
            }
          })
      );
    }
    this.base64 = this.pdfFile || null;
    const pdfUrl = this.selectedNote?.pdfURI || this.srcUrl;
    const franchiseId = localStorage.getItem('clinicGroupFranchiseId');
    if (pdfUrl) {
      // this.document = `franchise${franchiseId}/${pdfUrl}`;
      this.document = `${this.clinic.clinicId}/${pdfUrl}`;
      this.downloadFile(`${this.fileApiUrl}pdfviewer/LoadBase64`, this.document)
        .pipe(switchMap((pdfFile: any) => {
          if (!pdfFile) {
            if (this.isPhysiotech) {
              const physioTechLoadPdfUrl = `${this.baseUrl}exerciseprograms/physiotec/downloadExercises/clientchartnotes/${this.selectedNote.chartNoteId}`;
              return this.http.post<ChartNote>(physioTechLoadPdfUrl, null)
                .pipe(switchMap(chartNote => {
                  if (chartNote?.pdfURI) {
                    // this.document = `franchise${franchiseId}/${pdfUrl}`;
                    this.document = `${this.clinic.clinicId}/${pdfUrl}`;
                    return this.downloadFile(`${this.fileApiUrl}pdfviewer/LoadBase64`, this.document);
                  } else {
                    return of(null);
                  }
                }));
            } else {
              return of(null);
            }
          } else {
            return of(pdfFile);
          }
        }))
        .subscribe(pdfFile => {
          if (!pdfFile) {
            this.base64 = null;
            this.pdfLoadingSubject.next(false);
          } else {
            this.base64 = pdfFile.result;
            this.psPDFService.loadDocument(this.base64, '.pspdfkit-container').then(() => {
              this.ref.markForCheck();
              this.pdfLoadingSubject.next(false);
            });
          }
        });
    } else if(this.base64){
        this.psPDFService.loadDocument(this.base64, '.pspdfkit-container').then(() => {
          this.ref.markForCheck();
          this.pdfLoadingSubject.next(false);
        });
    } else{
      this.ref.markForCheck();
      this.pdfLoadingSubject.next(false);
    }
  }

  private downloadFile(url: string, file: string): any {
    let params = new HttpParams();
    params = params.append('path', file);
    return this.http.get<any>(url, {params, responseType: 'json'});
  }

  fillFormGroup(): void {
    this.viewerFormGroup = new FormGroup({
      caseId: new FormControl(this.selectedNote.clientCaseId || null),
      practitionerId: new FormControl(this.selectedNote.practitionerId || null),
      chartNoteId: new FormControl(this.selectedNote.chartNoteId || null)
    }, {});
  }

  onPreviousNoteClick(): void {
    if (this.currentIndex > 0) {
      this.currentIndex -= 1;
      this.selectedNote = this.chartNoteDropdown[this.currentIndex];
      this.viewerFormGroup.get('chartNoteId').setValue(this.selectedNote.chartNoteId);
      this.getPdf();
    }
  }

  onNoteSelected(event): void {
    if(event?.event){
      this.currentIndex = this.chartNoteDropdown.findIndex(cn => cn.chartNoteId === event.value) || 0;
      this.selectedNote = this.chartNoteDropdown[this.currentIndex];
      this.getPdf();
    }
  }

  onNextNoteClick(): void {
    if (this.currentIndex < (this.chartNoteDropdown.length - 1)) {
      this.currentIndex += 1;
      this.selectedNote = this.chartNoteDropdown[this.currentIndex];
      this.viewerFormGroup.get('chartNoteId').setValue(this.selectedNote.chartNoteId);
      this.getPdf();
    }
  }

  fillChartNoteDropdownByCase(caseId: number): void {
    if (this.clientNotes) {
      this.chartNoteDropdown = this.clientNotes.filter(chartNote => chartNote.clientCaseId === caseId);
      this.ref.markForCheck();
    }
  }

  fillChartNoteDropdownByPractitioner(practitionerId: number): void {
    if (this.clientNotes) {
      this.chartNoteDropdown = this.clientNotes.filter(chartNote => chartNote.practitionerId === practitionerId);
      this.ref.markForCheck();
    }
  }

  fillCaseDropdown(): void {
    this.caseDropdown = [];
    if (this.clientNotes) {
      this.clientNotes.forEach(chartNote => {
        if (!this.caseDropdown.find(clientCase => chartNote.clientCaseId === clientCase.id)) {
          this.caseDropdown.push({
            id: chartNote.clientCaseId,
            name: chartNote.caseName
          });
        }
      });
    }
  }

  fillPractitionerDropdown(): void {
    this.practitionerDropdown = [];
    if (this.clientNotes) {
      this.clientNotes.forEach(chartNote => {
        if (!this.practitionerDropdown.find(practitioner => chartNote.practitionerId === practitioner.id)) {
          this.practitionerDropdown.push({
            id: chartNote.practitionerId,
            name: chartNote.practitioner
          });
        }
      });
    }
  }

  fillChartNoteEntities(): void {
    this.chartNoteEntities = [];
    const clientInfo = {
      email: this.curClient?.contactInformation?.email,
      entityDescription: 'Client',
      fax: this.curClient?.contactInformation?.fax,
      fullName: this.curClient?.fullName
    };
    this.chartNoteEntities.push(clientInfo);
  }

  onEmailClick(): void {
   if (this.actionsService.isActionSecured(SysSecuredActionsEnum.SendEmailSMS)) {
    this.fillChartNoteEntities();
    this.subscription.add(
      of(this.selectedNote)
        .pipe(
          switchMap(selectedNote => {
              if (selectedNote) {
                return this.chartNoteService.getContactEntities(this.selectedNote.clientId, this.selectedNote.chartNoteId);
              } else {
                return of(null);
              }
            }
          )
        )
        .subscribe((entities: any) => {
          if (entities && entities.faxEntities) {
            entities.faxEntities.forEach(entity => {
              if (entity.email) {
                this.chartNoteEntities.push(entity);
              }
            });
          }
          const config: DynamicConfig = {panelClass: 'cm-popup medium', animation: 'scale', outsideClick: false};
          this.dynamicLoaderService.open(EmailChartDialogComponent, config).then(container => {
            if (!container.componentRef) {
              return;
            }

            const emailChartDialogComponent = container.componentRef.instance;
            emailChartDialogComponent.chartNote = this.selectedNote;
            emailChartDialogComponent.chartNoteReport = this.selectedNoteReport;
            emailChartDialogComponent.chartNoteEntities = this.chartNoteEntities;
          });
        })
    );
   }
  }

  onFaxClick(): void {
   if (this.isExplanationOfBenefits) {
    this.onFaxExplanationOfBenefits();
   } else {
    this.fillChartNoteEntities();
    if (this.selectedNote) {
      this.subscription.add(
        this.chartNoteService.getContactEntities(this.selectedNote.clientId, this.selectedNote.chartNoteId)
          .subscribe((entities: any) => {
            if (entities && entities.faxEntities) {
              entities.faxEntities.forEach(entity => {
                if (entity.fax) {
                  this.chartNoteEntities.push(entity);
                }
              });
            }

          })
      );
    }

    const config: DynamicConfig = {panelClass: 'cm-popup medium', animation: 'scale', outsideClick: false};
    this.dynamicLoaderService.open(FaxChartDialogComponent, config).then(container => {
      if (!container.componentRef) {
        return;
      }

      const faxChartDialogComponent = container.componentRef.instance;
      faxChartDialogComponent.note = this.selectedNote;
      faxChartDialogComponent.chartNoteReport = this.selectedNoteReport;
      faxChartDialogComponent.chartNoteEntities = this.chartNoteEntities;
    });
   }
  }

  onFaxExplanationOfBenefits(): void {
    this.fillChartNoteEntities();
    const reportInvoiceParams = [
      {
        name: 'IsDuplicate',
        value: false
      },
      {
        name: 'ClinicId',
        value: this.clinic.clinicId
      },
      {
        name: 'EntityId',
        value: this.portalUser.entityId
      }
    ];
    const reportApiParams = {
      url: this.selectedNote?.pdfURI || this.srcUrl,
      downLoadName: this.pdfTitle,
      parameters: reportInvoiceParams
    };

    const config: DynamicConfig = { panelClass: 'cm-popup medium', animation: 'scale', outsideClick: false };
    this.dynamicLoaderService.open(FaxChartDialogComponent, config).then(container => {
      if (!container.componentRef) {
        return;
      }

      const faxChartDialogComponent = container.componentRef.instance;
      faxChartDialogComponent.note = null;
      faxChartDialogComponent.chartNoteReport = null;
      faxChartDialogComponent.chartNoteEntities = this.chartNoteEntities;
      faxChartDialogComponent.isFaxInvoice = false;
      faxChartDialogComponent.invoiceParams = reportApiParams;

      faxChartDialogComponent.isExplanationOfBenefits = true;
      faxChartDialogComponent.clientCaseExplanationOfBenefitId = this.clientCaseExplanationOfBenefitId;

      faxChartDialogComponent.explanationOfBenefitsClientId = this.explanationOfBenefitsClientId,
      faxChartDialogComponent.explanationOfBenefitsClientCaseId = this.explanationOfBenefitsClientCaseId
    });

  }

  onNewTaskClick(): void {
    const dynamicConfig: DynamicConfig = {panelClass: 'cm-popup small', animation: 'scale'};
    this.dynamicLoaderService.open(TaskDialogComponent, dynamicConfig).then(container => {
      if (!container.componentRef) {
        return;
      }

      const taskDialogComponent = container.componentRef.instance;
      taskDialogComponent.selectedClient = {
        clientId: this.curClient.clientId,
        fullName: this.curClient.fullName
      };
    });
  }

  onEditChartNoteClick(): void {
    this.actionsService.openChartNote({note: Object.assign({}, this.selectedNote)})
      .then();
    /*switch (this.selectedNote.documentType.id) {
      case DocumentTypesEnum.SmartDoc :
      case DocumentTypesEnum.PortalForm :
        this.actionsService.openChartNoteWebPdfComponent(Object.assign({}, this.selectedNote)).then();
        this.onCloseClick();
        /!*const noteConfig: DynamicConfig = { panelClass: 'cm-popup full', animation: 'fromRight' };
        this.dynamicLoaderService.open(EditChartNoteComponent, noteConfig).then(container => {
          if (!container.componentRef) {
            return;
          }

          const editChartNoteComponent = container.componentRef.instance;
          editChartNoteComponent.chartNote = Object.assign({}, this.selectedNote);
          editChartNoteComponent.rightPanelVisibleState = false;
          editChartNoteComponent.rightPanelActiveTab = null;

          this.onCloseClick();
        });*!/
        break;
      case DocumentTypesEnum.Document :
        const config: DynamicConfig = { panelClass: 'cm-popup full', animation: 'fromRight' };
        this.dynamicLoaderService.open(EditChartNoteTxDocumentComponent, config).then(container => {
          if (!container.componentRef) {
            return;
          }

          const editChartNoteDocumentComponent = container.componentRef.instance;
          editChartNoteDocumentComponent.chartNote = Object.assign({}, this.selectedNote);
          editChartNoteDocumentComponent.rightPanelVisibleState = false;
          editChartNoteDocumentComponent.rightPanelActiveTab = null;
          this.onCloseClick();
        });
        break;
      case DocumentTypesEnum.Attachment :
        break;
      case DocumentTypesEnum.ExerciseProgram :
        break;
    }*/
  }

  signOffChartNote(): void {
    this.subscription.add(
      this.dialogHelperService.confirmDialog(this.translateService.instant('chart_note.confirm_sign_off'))
        .pipe(switchMap(dialogResult => {
          if (dialogResult) {
            return this.chartNoteService.signOffChartNote(this.selectedNote.clientId, this.selectedNote.chartNoteId);
          } else {
            return EMPTY;
          }
        }))
        .subscribe(() => {
          this.selectedNote.chartNoteStatus = ChartNoteStatusEnum.SignedOff;
          this.ref.markForCheck();
        })
    );
  }

  showEditButton(): boolean {
    return !this.hideEditButton
      && (this.selectedNote.clinicId === this.clinic.clinicId
        || this.selectedNote.clinicId !== this.clinic.clinicId && this.selectedNote.practitionerId === this.portalUser.entityId);
  }

  showSignOffButton(): boolean {
    return !!this.selectedNote?.isSignOffRequired
      && this.selectedNote?.chartNoteStatus !== ChartNoteStatusEnum.SignedOff
      && this.selectedNote?.chartNoteStatus !== ChartNoteStatusEnum.Draft
      && !this.selectedNote?.idbNoteCreatedDate
      && (this.selectedNote.clinicId === this.clinic.clinicId
        || this.selectedNote.clinicId !== this.clinic.clinicId && this.selectedNote.practitionerId === this.portalUser.entityId);
  }

  formatTodate(dateTimeValue: string): string {
    const m = moment(dateTimeValue);
    return dateTimeValue ? '(' + m.format('YYYY/MM/DD') + ')' : '';
  }

  onFullScreenClick(): void {
    const config: DynamicConfig = {panelClass: 'cm-popup full', animation: 'fromRight'};
    this.dynamicLoaderService.open(PdfViewerComponent, config).then(container => {
      if (!container.componentRef) {
        return;
      }

      const pdfViewerComponent = container.componentRef.instance;
      pdfViewerComponent.srcUrl = this.selectedNote?.pdfURI || this.srcUrl;
      pdfViewerComponent.selectedNote = this.selectedNote;
      pdfViewerComponent.disableEdit = this.disableEdit;
      pdfViewerComponent.isFullScreen = true;
      pdfViewerComponent.simpleActions = this.simpleActions;
      pdfViewerComponent.isPhysiotech = this.selectedNote?.documentType?.id === DocumentTypesEnum.ExerciseProgram;
    });
    this.onCloseClick();
  }

  afterPrintReport(): void {
    if (this.selectedNote?.clientId && this.selectedNote?.chartNoteId) {
      this.subscription.add(
        this.chartNoteService.auditPrintChartNoteForm(this.selectedNote?.clientId, this.selectedNote?.chartNoteId)
          .subscribe(printed => {
          })
      );
    }
  }

  pdfDownloadedReport(): void {
    if (this.selectedNote?.clientId && this.selectedNote?.chartNoteId) {
      this.subscription.add(
        this.chartNoteService.auditDownloadChartNoteForm(this.selectedNote?.clientId, this.selectedNote?.chartNoteId)
          .subscribe(downloaded => {
          })
      );
    }
  }

  onCloseClick(): void {
    this.closePopup.emit(true);
    this.store.dispatch(fromRoot.setDynamicContainerIdToClose({dynamicContainerId: this.dynamicContainerId}));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
