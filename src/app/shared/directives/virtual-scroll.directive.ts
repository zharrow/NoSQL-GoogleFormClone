// src/app/shared/directives/virtual-scroll.directive.ts

import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { fromEvent, Subject, takeUntil, throttleTime } from 'rxjs';

@Directive({
  selector: '[appVirtualScroll]',
  standalone: true
})
export class VirtualScrollDirective implements OnInit, OnDestroy {
  @Input() appVirtualScrollOf: any[] = [];
  @Input() appVirtualScrollItemHeight = 50;
  @Input() appVirtualScrollBuffer = 5;
  
  private destroy$ = new Subject<void>();
  private scrollContainer?: HTMLElement;
  private visibleRange = { start: 0, end: 0 };
  
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}
  
  ngOnInit(): void {
    this.scrollContainer = this.viewContainer.element.nativeElement.parentElement;
    if (!this.scrollContainer) return;
    
    // Créer un spacer pour maintenir la hauteur
    const spacer = document.createElement('div');
    spacer.style.height = `${this.appVirtualScrollOf.length * this.appVirtualScrollItemHeight}px`;
    this.scrollContainer.appendChild(spacer);
    
    // Écouter le scroll
    fromEvent(this.scrollContainer, 'scroll').pipe(
      throttleTime(16), // ~60fps
      takeUntil(this.destroy$)
    ).subscribe(() => this.onScroll());
    
    // Render initial
    this.onScroll();
  }
  
  private onScroll(): void {
    if (!this.scrollContainer) return;
    
    const scrollTop = this.scrollContainer.scrollTop;
    const containerHeight = this.scrollContainer.clientHeight;
    
    const startIndex = Math.floor(scrollTop / this.appVirtualScrollItemHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / this.appVirtualScrollItemHeight);
    
    const bufferedStart = Math.max(0, startIndex - this.appVirtualScrollBuffer);
    const bufferedEnd = Math.min(
      this.appVirtualScrollOf.length, 
      endIndex + this.appVirtualScrollBuffer
    );
    
    // Optimisation: ne re-render que si nécessaire
    if (bufferedStart !== this.visibleRange.start || bufferedEnd !== this.visibleRange.end) {
      this.visibleRange = { start: bufferedStart, end: bufferedEnd };
      this.renderVisibleItems();
    }
  }
  
  private renderVisibleItems(): void {
    this.viewContainer.clear();
    
    for (let i = this.visibleRange.start; i < this.visibleRange.end; i++) {
      const view = this.viewContainer.createEmbeddedView(this.templateRef, {
        $implicit: this.appVirtualScrollOf[i],
        index: i
      });
      
      // Positionner l'élément
      const element = view.rootNodes[0] as HTMLElement;
      element.style.position = 'absolute';
      element.style.top = `${i * this.appVirtualScrollItemHeight}px`;
      element.style.left = '0';
      element.style.right = '0';
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}