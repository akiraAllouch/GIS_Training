import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { BankStoreService } from '../modules/Services/bankService/bank.store.service';
import { Branch } from '../modules/Services/branchService/branch-model';
import { Bank } from '../modules/Services/bankService/bank-model';
import { BranchStoreService } from '../modules/Services/branchService/branch.store.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import {MatDialog, MatDialogConfig} from "@angular/material/dialog";
import { MapComponent } from '../map/map.component';
import { MapDialogComponent } from '../map-dialog/map-dialog.component';
import { take } from 'rxjs/operators';
@Component({
  selector: 'app-bank-owner',
  templateUrl: './bank-owner.component.html',
  styleUrls: ['./bank-owner.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class BankOwnerComponent implements OnInit, OnDestroy {
  ngOnDestroy(): void {
    this.subscrption.unsubscribe();
  }
  @ViewChild("viewX") public viewXEl: ElementRef;
  @ViewChild("viewY") public viewYEl: ElementRef;
  //if we should display that it is loading. One for the banjs and one for the branches
  loadingBank: boolean=true;
  loadingBranch: boolean= true;
  //where i put the data that i get from the store
  errors: string[]=new Array<string>();
  banks$: Observable<Array<Bank>>;
  branches$ : Observable<Array<Branch>>;
  tempSubscription: Subscription;
  //What the checkBox Selects. Default value is Banks[0]/
  selectedBank: Bank= new Bank();
  
  //For adding a new branch
  addBranch: boolean=false;
  newBranch :FormGroup;
  subscrption: Subscription;
  //Banks sum.
  constructor(private bankStoreService: BankStoreService, private branchStoreService: BranchStoreService,
    private fb :FormBuilder, private cd: ChangeDetectorRef, private dialog: MatDialog) {
    this.newBranch= fb.group(new Branch());
    this.banks$=this.bankStoreService.getBanks();
    this.subscrption=this.bankStoreService.getSelected().subscribe(bank=>{
      this.addBranch=false;
      this.newBranch= this.fb.group(new Branch());
      this.errors= new Array<string>();
      this.loadingBranch=false;
      if(bank.name!=""){
        this.selectedBank=bank;
        this.branchStoreService.loadBranch(false,bank.name);
        
      }

     });   
     this.branches$=this.branchStoreService.getBranches();
     
  }
  errorControl() : boolean{
    this.newBranch.value.x=this.viewXEl.nativeElement.value;
    this.newBranch.value.y=this.viewYEl.nativeElement.value;
    this.errors= new Array<string>()
    if(this.newBranch.value.name==null ||this.newBranch.value.x==0 || this.newBranch.value.y==0){
      this.errors.push("fill it all");
      this.cd.detectChanges();
      return false;
    }
    return true;
    
  }
  submit(currentBank: string){
    this.bankStoreService.updateSelected(currentBank);
  }
  displayMap(){
    //OPEN DIALOG;
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data= {
      bankname: this.selectedBank.name,
      branches: this.branchStoreService.getSnapshot().branches,
      form: this.newBranch,
      xref: this.viewXEl,
      yref: this.viewYEl
    }
    const dialogRef = this.dialog.open(MapDialogComponent,dialogConfig);
  }
  postBranch(){
    if(this.errorControl()){
      this.subscrption= this.branchStoreService.getBranchByName(this.newBranch.value.name).pipe(take(1)).subscribe(res=>{
        if(res){
          //already exists
          this.errors.push("the name already exists");
          this.cd.detectChanges();
        }
        else{
          //Updating
          this.newBranch.value.bank=this.selectedBank.name;
          console.log(this.newBranch.value);
          this.branchStoreService.addBranch(this.newBranch.value);
          //Reseting
          this.addBranch=false;
          this.cd.markForCheck();
          this.newBranch= this.fb.group(new Branch());
        }
      });
    }
  }
  
  ngOnInit() {
    /*this.branchService.loadBranch().then(res1=>{
      if(res1!=null)
      { 
        this.mapService.initializeMap(res1 as Array<Branch>,this.mapviewEl);
        // this.cd.detectChanges();
      }
    }); */



    this.bankStoreService.isLoading().subscribe(res=> {
      this.loadingBank= !res;
      this.cd.detectChanges();
     });
     this.branchStoreService.isLoading().subscribe(res=> {
       this.loadingBranch= !res;
       this.cd.detectChanges();
     });
  }

}
