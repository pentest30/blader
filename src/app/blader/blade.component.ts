import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ComponentRef,
  ViewContainerRef,
  ViewChild,
  ComponentFactoryResolver,
  HostBinding
} from '@angular/core';

import {
  BladeContext,
  BladeArgs,
  BladeState
} from './models';

@Component({
  selector: 'tw-blade',
  template: `
  <div class="blade__header" (click)="clicked()">
    <div class="blade__commands">
      <span *ngIf="canMinimize" (click)="changeState(1)">
        <tw-icon name="window-minimize"></tw-icon>
      </span>
      <span *ngIf="canMaximize" (click)="changeState(2)">
        <tw-icon name="window-restore"></tw-icon>
      </span>
      <span *ngIf="canClose" (click)="close()">
        <tw-icon name="window-close"></tw-icon>
      </span>
    </div>
    <h3>{{ title }}</h3>
  </div>
  <div class="blade__content">
    <ng-template #bladeContent></ng-template>
  </div>`
})
export class BladeComponent implements OnInit, OnDestroy {
  private _componentRef: ComponentRef<any>;
  private _bladeState: BladeState = BladeState.default;

  @Input()
  public context: BladeContext;

  @Output()
  public stateChanged: EventEmitter<BladeState> = new EventEmitter<BladeState>();

  @Output()
  public selected: EventEmitter<BladeArgs> = new EventEmitter<BladeArgs>();

  @Output()
  public closed: EventEmitter<BladeArgs> = new EventEmitter<BladeArgs>();

  public get title(): string {
    return this._componentRef.instance.title;
  }

  public get isDirty(): boolean {
    return this._componentRef.instance.isDirty;
  }

  public get canMinimize(): boolean {
    return this._bladeState === BladeState.wide;
  }

  public get canMaximize(): boolean {
    return this._bladeState === BladeState.default;
  }

  public get canClose(): boolean {
    if (this.context.isEntry) {
      return false;
    }

    return !this.isDirty;
  }

  @HostBinding('class')
  public classlist = this.getClassList();

  @ViewChild('bladeContent', { read: ViewContainerRef })
  protected bladeContent: ViewContainerRef;

  public ngOnInit(): void {
    if (this.context) {
      const factory = this.context.metaData.factoryFn
        ? this.context.metaData.factoryFn()
        : this.bladeContent.injector
          .get(ComponentFactoryResolver)
          .resolveComponentFactory(this.context.metaData.component);

      this._componentRef = this.bladeContent
        .createComponent(factory, this.bladeContent.length);
      this._componentRef.instance.id = this.context.id;

      console.log(`initialized ${this.title} blade:`, this.context.id);
    }
  }

  public ngOnDestroy(): void {
    if (this._componentRef) {
      console.log(`destroying ${this.title}`);

      this._componentRef.destroy();
    }
  }

  public clicked(): void {
    this.selected.next(this.context.toBladeArgs());
  }

  public changeState(state: BladeState): void {
    this._bladeState = state;

    this.classlist = this.getClassList();

    this.stateChanged.next(this._bladeState);
  }

  public close(): void {
    this.closed.next(this.context.toBladeArgs());
  }

  private getClassList(): string {
    if (this._bladeState === BladeState.wide) {
      return 'blade blade--wide';
    }

    return 'blade';
  }
}
