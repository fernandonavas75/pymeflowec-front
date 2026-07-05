import{a as ae}from"./chunk-2HQSPWMI.js";import{b as N}from"./chunk-EJTWW63T.js";import{a as le}from"./chunk-YG6AGUH5.js";import{a as re}from"./chunk-F37ZO45W.js";import{c as G}from"./chunk-6RVQSON7.js";import{u as q}from"./chunk-3AQIC6XZ.js";import"./chunk-XAZLOLJU.js";import{b as K,c as O,d as Q,e as R,g as D,h as U,i as H,j as W,k as J,l as X,m as Y,n as Z,o as ee,q as te,s as ne,u as ie}from"./chunk-NUIRDTKG.js";import{a as oe}from"./chunk-2U3ML4CZ.js";import"./chunk-PW6UG2XF.js";import"./chunk-INKSPBAY.js";import{Bb as u,Db as d,H as M,Mb as l,N as T,Nb as h,Ob as b,Ra as o,Sb as L,Tb as F,Z as E,aa as A,bb as f,gc as P,hb as C,jb as s,ka as _,la as g,lb as y,qb as x,sb as I,sc as j,tb as S,ub as k,vb as i,wb as a,xb as m,yb as v}from"./chunk-6UJS6K6X.js";import{a as B,b as $}from"./chunk-YHOLSLLF.js";var z=(t,c)=>c.id,de=()=>[1,2,3,4,5],se=()=>[1,2,3];function pe(t,c){t&1&&m(0,"div",17)}function me(t,c){t&1&&(i(0,"div",14),S(1,pe,1,0,"div",17,I),a()),t&2&&(o(),k(F(0,de)))}function ue(t,c){if(t&1){let e=v();i(0,"div",18),m(1,"app-icon",19),i(2,"p"),l(3,"Sin categor\xEDas a\xFAn"),a(),i(4,"button",20),u("click",function(){_(e);let n=d();return g(n.openCreate())}),m(5,"app-icon",6),l(6,"Crear primera "),a()()}t&2&&(o(),s("size",40),o(4),s("size",13))}function _e(t,c){if(t&1&&(i(0,"span",34),m(1,"app-icon",41),l(2),a()),t&2){let e=d().$implicit,r=d(2);o(),s("size",10),o(),b("",r.parentName(e)," ")}}function ge(t,c){if(t&1){let e=v();i(0,"div",30),u("click",function(){let n=_(e).$implicit,p=d(2);return g(p.selectCategory(n.id))}),i(1,"div",31),m(2,"app-icon",32),a(),i(3,"div",26)(4,"span",33),l(5),a(),C(6,_e,3,2,"span",34),a(),i(7,"div",35),u("click",function(n){return _(e),g(n.stopPropagation())}),i(8,"span",29),l(9),a(),i(10,"div",36)(11,"button",37),u("click",function(){let n=_(e).$implicit,p=d(2);return g(p.openEdit(n))}),m(12,"app-icon",38),a(),i(13,"button",39),u("click",function(){let n=_(e).$implicit,p=d(2);return g(p.deleteCategory(n))}),m(14,"app-icon",40),a()()()()}if(t&2){let e,r,n=c.$implicit,p=d(2);y("selected",p.selectedId()===n.id),o(2),s("size",14),o(3),h(n.name),o(),x(6,n.parent_id?6:-1),o(2),y("has-prods",((e=p.productCountByCategory().get(n.id))!==null&&e!==void 0?e:0)>0),o(),b(" ",(r=p.productCountByCategory().get(n.id))!==null&&r!==void 0?r:0," "),o(3),s("size",13),o(2),s("size",13)}}function Ce(t,c){if(t&1){let e=v();i(0,"div",21),S(1,ge,15,10,"div",22,z),i(3,"div",23),u("click",function(){_(e);let n=d();return g(n.selectCategory("unassigned"))}),i(4,"div",24),m(5,"app-icon",25),a(),i(6,"div",26)(7,"span",27),l(8,"Sin categor\xEDa"),a()(),i(9,"div",28)(10,"span",29),l(11),a()()()()}if(t&2){let e=d();o(),k(e.filteredCategories()),o(2),y("selected",e.selectedId()==="unassigned"),o(2),s("size",14),o(5),y("has-prods",e.unassignedCount()>0),o(),b(" ",e.unassignedCount()," ")}}function xe(t,c){t&1&&(i(0,"div",15)(1,"div",42),m(2,"app-icon",43),a(),i(3,"strong",44),l(4,"Selecciona una categor\xEDa"),a(),i(5,"p",45),l(6," Haz clic en una categor\xEDa para ver y reasignar sus productos "),a()()),t&2&&(o(2),s("size",28))}function fe(t,c){t&1&&m(0,"div",57)}function ve(t,c){t&1&&(i(0,"div",56),S(1,fe,1,0,"div",57,I),a()),t&2&&(o(),k(F(0,se)))}function he(t,c){if(t&1){let e=v();i(0,"p",60),l(1,"Sin coincidencias"),a(),i(2,"button",20),u("click",function(){_(e);let n=d(3);return g(n.productSearchCtrl.setValue(""))}),l(3,"Limpiar b\xFAsqueda"),a()}}function be(t,c){t&1&&l(0," Todos los productos tienen categor\xEDa asignada ")}function Pe(t,c){t&1&&l(0," No hay productos en esta categor\xEDa ")}function ye(t,c){if(t&1&&(i(0,"p",61),C(1,be,1,0)(2,Pe,1,0),a()),t&2){let e=d(3);o(),x(1,e.selectedId()==="unassigned"?1:2)}}function Se(t,c){if(t&1&&(i(0,"div",58),m(1,"app-icon",59),C(2,he,4,0)(3,ye,3,1),a()),t&2){let e=d(2);o(),s("size",36),o(),x(2,e.productSearchCtrl.value?2:3)}}function ke(t,c){if(t&1&&(i(0,"span",67),l(1),a()),t&2){let e=d().$implicit;o(),b("SKU: ",e.sku,"")}}function we(t,c){t&1&&(i(0,"span",70),m(1,"app-icon",71),l(2,"Guardando\u2026 "),a()),t&2&&(o(),s("size",12))}function Ee(t,c){if(t&1&&(i(0,"option",74),l(1),a()),t&2){let e=c.$implicit;s("value",e.id),o(),h(e.name)}}function Oe(t,c){if(t&1){let e=v();i(0,"select",72),u("change",function(n){_(e);let p=d().$implicit,w=d(3);return g(w.assignCategory(p,n))}),i(1,"option",73),l(2,"Sin categor\xEDa"),a(),S(3,Ee,2,2,"option",74,z),a()}if(t&2){let e,r=d().$implicit,n=d(3);s("value",(e=r.category_id)!==null&&e!==void 0?e:""),o(3),k(n.allCategories())}}function Me(t,c){if(t&1){let e=v();i(0,"div",63)(1,"div",64),l(2),a(),i(3,"div",65)(4,"span",66),l(5),a(),C(6,ke,2,1,"span",67),a(),i(7,"div",68),l(8),a(),i(9,"div",69),u("click",function(n){return _(e),g(n.stopPropagation())}),C(10,we,3,1,"span",70)(11,Oe,5,1),a()()}if(t&2){let e=c.$implicit,r=d(3);o(2),h(e.name.charAt(0).toUpperCase()),o(3),h(e.name),o(),x(6,e.sku?6:-1),o(),y("low",e.stock<=5),o(),b(" ",e.stock," uds. "),o(2),x(10,r.savingProductId()===e.id?10:11)}}function ze(t,c){if(t&1&&(i(0,"div",62),S(1,Me,12,7,"div",63,z),a()),t&2){let e=d(2);o(),k(e.panelProducts())}}function Ve(t,c){if(t&1){let e=v();i(0,"div",46)(1,"div",47)(2,"div",48),m(3,"app-icon",32),a(),i(4,"div")(5,"div",49),l(6),a(),i(7,"div",50),l(8),a()()(),i(9,"div",51)(10,"div",52),m(11,"app-icon",11)(12,"input",53),a(),i(13,"button",54),u("click",function(){_(e);let n=d();return g(n.selectedId.set(null))}),m(14,"app-icon",55),a()()(),C(15,ve,3,1,"div",56)(16,Se,4,2)(17,ze,3,0)}if(t&2){let e=d();o(3),s("size",14),o(3),h(e.selectedCategoryName()),o(2),b("",e.panelProducts().length," producto(s)"),o(3),s("size",13),o(),s("formControl",e.productSearchCtrl),o(2),s("size",14),o(),x(15,e.loadingProducts()?15:e.panelProducts().length===0?16:17)}}function Te(t,c){t&1&&(i(0,"span",88),l(1,"El nombre es requerido"),a())}function Ie(t,c){if(t&1&&(i(0,"option",91),l(1),a()),t&2){let e=c.$implicit;s("ngValue",e.id),o(),h(e.name)}}function Fe(t,c){t&1&&(m(0,"app-icon",71),l(1,"Guardando\u2026 ")),t&2&&s("size",13)}function De(t,c){if(t&1&&l(0),t&2){let e=d(2);b(" ",e.editingId()?"Guardar cambios":"Crear categor\xEDa"," ")}}function Ne(t,c){if(t&1){let e=v();i(0,"div",75),u("click",function(){_(e);let n=d();return g(n.closeModal())}),i(1,"div",76),u("click",function(n){return _(e),g(n.stopPropagation())}),i(2,"div",77)(3,"div",78)(4,"div",79),m(5,"app-icon",32),a(),i(6,"div")(7,"div",80),l(8),a(),i(9,"div",81),l(10,"Categor\xEDas de productos"),a()()(),i(11,"button",82),u("click",function(){_(e);let n=d();return g(n.closeModal())}),m(12,"app-icon",55),a()(),i(13,"form",83),u("ngSubmit",function(){_(e);let n=d();return g(n.onSubmit())}),i(14,"div",84)(15,"div",85)(16,"label"),l(17,"Nombre "),i(18,"span",86),l(19,"*"),a()(),m(20,"input",87),C(21,Te,2,0,"span",88),a(),i(22,"div",85)(23,"label"),l(24,"Categor\xEDa padre "),i(25,"span",89),l(26,"(opcional)"),a()(),i(27,"select",90)(28,"option",91),l(29,"Sin categor\xEDa padre"),a(),S(30,Ie,2,2,"option",91,z),a()(),i(32,"div",85)(33,"label"),l(34,"Orden de visualizaci\xF3n"),a(),m(35,"input",92),i(36,"span",93),l(37,"N\xFAmero menor aparece primero en la lista"),a()()(),i(38,"div",94)(39,"button",95),C(40,Fe,2,1)(41,De,1,1),a(),i(42,"button",96),u("click",function(){_(e);let n=d();return g(n.closeModal())}),l(43,"Cancelar"),a()()()()()}if(t&2){let e,r,n=d();o(5),s("size",16),o(3),h(n.editingId()?"Editar categor\xEDa":"Nueva categor\xEDa"),o(4),s("size",16),o(),s("formGroup",n.form),o(7),y("error",((e=n.form.get("name"))==null?null:e.invalid)&&((e=n.form.get("name"))==null?null:e.touched)),o(),x(21,!((r=n.form.get("name"))==null||r.errors==null)&&r.errors.required&&((r=n.form.get("name"))!=null&&r.touched)?21:-1),o(7),s("ngValue",null),o(2),k(n.parentOptions()),o(9),s("disabled",n.saving()),o(),x(40,n.saving()?40:41)}}var Xe=(()=>{class t{constructor(){this.svc=E(le),this.productsSvc=E(re),this.dialog=E(G),this.snackBar=E(q),this.fb=E(ne),this.allCategories=f([]),this.allProducts=f([]),this.loading=f(!1),this.loadingProducts=f(!1),this.saving=f(!1),this.savingProductId=f(null),this.searchCtrl=new D(""),this.productSearchCtrl=new D(""),this.searchQuery=N(this.searchCtrl.valueChanges.pipe(T("")),{initialValue:""}),this.productSearchQuery=N(this.productSearchCtrl.valueChanges.pipe(T("")),{initialValue:""}),this.selectedId=f(null),this.modalOpen=f(!1),this.editingId=f(null),this.form=this.fb.group({name:["",[O.required,O.minLength(1),O.maxLength(100)]],parent_id:[null],sort_order:[0,[O.required,O.min(0)]]}),this.totalCount=P(()=>this.allCategories().length),this.filteredCategories=P(()=>{let e=(this.searchQuery()??"").toLowerCase();return e?this.allCategories().filter(r=>r.name.toLowerCase().includes(e)):this.allCategories()}),this.parentOptions=P(()=>this.allCategories().filter(e=>e.id!==(this.editingId()??-1))),this.productCountByCategory=P(()=>{let e=new Map;for(let r of this.allProducts()){let n=r.category_id??null;e.set(n,(e.get(n)??0)+1)}return e}),this.unassignedCount=P(()=>this.productCountByCategory().get(null)??0),this.panelProducts=P(()=>{let e=this.selectedId();if(e===null)return[];let r=e==="unassigned"?this.allProducts().filter(p=>!p.category_id):this.allProducts().filter(p=>p.category_id===e),n=(this.productSearchQuery()??"").toLowerCase();return n?r.filter(p=>p.name.toLowerCase().includes(n)||(p.sku??"").toLowerCase().includes(n)):r}),this.selectedCategoryName=P(()=>{let e=this.selectedId();return e===null?"":e==="unassigned"?"Sin categor\xEDa":this.allCategories().find(r=>r.id===e)?.name??""})}ngOnInit(){this.load(),this.loadProducts()}load(){this.loading.set(!0),this.svc.list().pipe(M(()=>this.loading.set(!1))).subscribe({next:e=>this.allCategories.set(e),error:()=>this.allCategories.set([])})}loadProducts(){this.loadingProducts.set(!0),this.productsSvc.list({limit:1e3}).pipe(M(()=>this.loadingProducts.set(!1))).subscribe({next:e=>this.allProducts.set(e.data),error:()=>this.allProducts.set([])})}selectCategory(e){this.selectedId.set(this.selectedId()===e?null:e),this.productSearchCtrl.setValue("")}assignCategory(e,r){let n=r.target.value,p=n===""?null:+n;p!==(e.category_id??null)&&(this.savingProductId.set(e.id),this.productsSvc.update(e.id,{category_id:p}).subscribe({next:w=>{this.allProducts.update(ce=>ce.map(V=>V.id===w.id?$(B({},V),{category_id:w.category_id??null}):V)),this.savingProductId.set(null),this.snackBar.open("Categor\xEDa actualizada","OK",{duration:2e3})},error:()=>{this.savingProductId.set(null),this.snackBar.open("Error al actualizar","OK",{duration:3e3}),this.loadProducts()}}))}openCreate(){this.editingId.set(null),this.form.reset({name:"",parent_id:null,sort_order:0}),this.modalOpen.set(!0)}openEdit(e){this.editingId.set(e.id),this.form.patchValue({name:e.name,parent_id:e.parent_id??null,sort_order:e.sort_order}),this.modalOpen.set(!0)}closeModal(){this.modalOpen.set(!1)}onSubmit(){if(this.form.invalid){this.form.markAllAsTouched();return}this.saving.set(!0);let e=this.form.getRawValue(),r={name:e.name,parent_id:e.parent_id??null,sort_order:e.sort_order??0},n=this.editingId();(n?this.svc.update(n,r):this.svc.create(r)).pipe(M(()=>this.saving.set(!1))).subscribe({next:()=>{this.snackBar.open(n?"Categor\xEDa actualizada":"Categor\xEDa creada","OK",{duration:3e3}),this.closeModal(),this.load()},error:w=>this.snackBar.open(w?.error?.message||"Error al guardar","OK",{duration:4e3})})}deleteCategory(e){this.dialog.open(ae,{data:{title:"Eliminar categor\xEDa",message:`\xBFEliminar "${e.name}"? Los productos asignados quedar\xE1n sin categor\xEDa.`,confirmText:"Eliminar",danger:!0}}).afterClosed().subscribe(n=>{n&&this.svc.remove(e.id).subscribe({next:()=>{this.snackBar.open("Categor\xEDa eliminada","OK",{duration:3e3}),this.selectedId()===e.id&&this.selectedId.set(null),this.load(),this.loadProducts()},error:p=>this.snackBar.open(p?.error?.message||"Error al eliminar","OK",{duration:4e3})})})}parentName(e){return e.parent_id?this.allCategories().find(r=>r.id===e.parent_id)?.name??"\u2014":"\u2014"}static{this.\u0275fac=function(r){return new(r||t)}}static{this.\u0275cmp=A({type:t,selectors:[["app-product-categories"]],standalone:!0,features:[L],decls:26,vars:8,consts:[[1,"page"],[1,"page-head"],[1,"page-title"],[1,"page-sub-en"],[1,"page-actions"],["type","button",1,"btn","primary",3,"click"],["name","plus",3,"size"],[1,"cat-grid"],[1,"cat-panel","card"],[1,"cat-panel-search"],[1,"filter-search",2,"margin","0","flex","1"],["name","search",3,"size"],["placeholder","Buscar categor\xEDa\u2026",3,"formControl"],[1,"cat-count-pill"],[1,"cat-skeleton-list"],[1,"empty",2,"padding","80px 32px","gap","12px"],[1,"modal-backdrop"],[1,"skel",2,"height","56px","border-radius","var(--radius-ds)"],[1,"empty",2,"padding","64px 24px"],["name","tag",2,"opacity",".18",3,"size"],["type","button",1,"btn","ghost","sm",3,"click"],[1,"cat-list"],[1,"cat-item",3,"selected"],[1,"cat-item","unassigned",3,"click"],[1,"cat-icon-wrap","muted"],["name","circle_dashed",3,"size"],[1,"cat-item-body"],[1,"cat-item-name","muted"],[1,"cat-item-meta"],[1,"cat-prod-badge"],[1,"cat-item",3,"click"],[1,"cat-icon-wrap"],["name","tag",3,"size"],[1,"cat-item-name"],[1,"cat-item-parent"],[1,"cat-item-meta",3,"click"],[1,"cat-item-actions"],["type","button","title","Editar",1,"btn","ghost","sm",3,"click"],["name","edit",3,"size"],["type","button","title","Eliminar",1,"btn","ghost","sm",2,"color","var(--danger)",3,"click"],["name","trash",3,"size"],["name","corner_down_right",3,"size"],[1,"cat-empty-icon"],["name","layers",3,"size"],[2,"font-size","14px","color","var(--text-ds)"],[2,"color","var(--text-subtle)","text-align","center","font-size","13px","max-width","220px","line-height","1.5"],[1,"cat-panel-header"],[1,"cat-panel-title-wrap"],[1,"cat-panel-icon"],[1,"cat-panel-title"],[1,"cat-panel-sub"],[2,"display","flex","align-items","center","gap","8px"],[1,"filter-search",2,"margin","0","width","200px"],["placeholder","Buscar producto\u2026",3,"formControl"],["type","button","title","Cerrar panel",1,"btn","ghost","sm",3,"click"],["name","x",3,"size"],[1,"cat-skeleton-list",2,"padding","16px"],[1,"skel",2,"height","60px","border-radius","var(--radius-ds)"],[1,"empty",2,"padding","60px 24px"],["name","package",2,"opacity",".18",3,"size"],[2,"color","var(--text-subtle)"],[2,"color","var(--text-subtle)","text-align","center","font-size","13px"],[1,"prod-card-list"],[1,"prod-card"],[1,"prod-avatar"],[1,"prod-info"],[1,"prod-name"],[1,"prod-sku"],[1,"prod-stock-badge"],[1,"prod-assign",3,"click"],[1,"prod-saving"],["name","loader",3,"size"],[1,"m-input","prod-select",3,"change","value"],["value",""],[3,"value"],[1,"modal-backdrop",3,"click"],[1,"modal-box",2,"width","460px",3,"click"],[1,"ds-modal-head"],[2,"display","flex","align-items","center","gap","12px"],[1,"modal-head-icon"],[1,"t"],[1,"d"],["type","button",1,"topbar-btn",3,"click"],[3,"ngSubmit","formGroup"],[1,"ds-modal-body",2,"display","flex","flex-direction","column","gap","20px"],[1,"mfield"],[2,"color","var(--danger)"],["formControlName","name","placeholder","Ej: Electr\xF3nica, Ropa, Alimentos\u2026",1,"m-input"],[1,"field-error"],[1,"label-opt"],["formControlName","parent_id",1,"m-input"],[3,"ngValue"],["type","number","formControlName","sort_order","min","0",1,"m-input",2,"width","120px"],[1,"field-hint"],[1,"ds-modal-foot"],["type","submit",1,"btn","primary",3,"disabled"],["type","button",1,"btn","ghost",3,"click"]],template:function(r,n){r&1&&(i(0,"div",0)(1,"div",1)(2,"div")(3,"div",2),l(4,"Categor\xEDas de productos"),a(),i(5,"div",3),l(6),a()(),i(7,"div",4)(8,"button",5),u("click",function(){return n.openCreate()}),m(9,"app-icon",6),l(10,"Nueva categor\xEDa "),a()()(),i(11,"div",7)(12,"div",8)(13,"div",9)(14,"div",10),m(15,"app-icon",11)(16,"input",12),a(),i(17,"span",13),l(18),a()(),C(19,me,3,1,"div",14)(20,ue,7,2)(21,Ce,12,6),a(),i(22,"div",8),C(23,xe,7,1,"div",15)(24,Ve,18,7),a()()(),C(25,Ne,44,10,"div",16)),r&2&&(o(6),b("Product categories \xB7 ",n.totalCount()," registradas"),o(3),s("size",14),o(6),s("size",13),o(),s("formControl",n.searchCtrl),o(2),h(n.totalCount()),o(),x(19,n.loading()?19:n.filteredCategories().length===0&&!n.searchCtrl.value?20:21),o(4),x(23,n.selectedId()===null?23:24),o(2),x(25,n.modalOpen()?25:-1))},dependencies:[j,ie,U,Z,ee,K,H,Y,Q,R,te,W,J,X,oe],styles:[`

.cat-grid[_ngcontent-%COMP%] {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 16px;
  align-items: start;
}



.cat-panel[_ngcontent-%COMP%] { overflow: hidden; }

.cat-panel-search[_ngcontent-%COMP%] {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-ds);
}

.cat-count-pill[_ngcontent-%COMP%] {
  font-size: 11px;
  font-weight: 600;
  background: var(--surface-2);
  color: var(--text-muted-ds);
  border-radius: 20px;
  padding: 2px 8px;
  min-width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.cat-skeleton-list[_ngcontent-%COMP%] {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}



.cat-list[_ngcontent-%COMP%] {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 2px;
}

.cat-item[_ngcontent-%COMP%] {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px 10px 10px;
  border-radius: var(--radius-ds);
  cursor: pointer;
  transition: background 0.12s;
  border: 1px solid transparent;
}
.cat-item[_ngcontent-%COMP%]:hover { background: var(--surface-2); }
.cat-item.selected[_ngcontent-%COMP%] {
  background: var(--accent-soft);
  border-color: var(--accent-soft-strong);
}

.cat-icon-wrap[_ngcontent-%COMP%] {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm-ds);
  background: var(--accent-soft);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cat-icon-wrap.muted[_ngcontent-%COMP%] {
  background: var(--surface-2);
  color: var(--text-subtle);
}

.cat-item-body[_ngcontent-%COMP%] {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cat-item-name[_ngcontent-%COMP%] {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-ds);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cat-item-name.muted[_ngcontent-%COMP%] { color: var(--text-subtle); font-style: italic; }
.cat-item-parent[_ngcontent-%COMP%] {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--text-subtle);
}

.cat-item-meta[_ngcontent-%COMP%] {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.cat-prod-badge[_ngcontent-%COMP%] {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 20px;
  background: var(--surface-2);
  color: var(--text-muted-ds);
  min-width: 22px;
  text-align: center;
}
.cat-prod-badge.has-prods[_ngcontent-%COMP%] {
  background: var(--accent-soft);
  color: var(--accent);
}

.cat-item-actions[_ngcontent-%COMP%] {
  display: none;
  gap: 2px;
}
.cat-item[_ngcontent-%COMP%]:hover   .cat-item-actions[_ngcontent-%COMP%] { display: flex; }



.cat-panel-header[_ngcontent-%COMP%] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-ds);
}
.cat-panel-title-wrap[_ngcontent-%COMP%] {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cat-panel-icon[_ngcontent-%COMP%] {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm-ds);
  background: var(--accent-soft);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cat-panel-title[_ngcontent-%COMP%] { font-size: 13px; font-weight: 600; color: var(--text-ds); }
.cat-panel-sub[_ngcontent-%COMP%] { font-size: 11px; color: var(--text-subtle); }



.cat-empty-icon[_ngcontent-%COMP%] {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg-ds);
  background: var(--surface-2);
  color: var(--text-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
}



.prod-card-list[_ngcontent-%COMP%] {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.prod-card[_ngcontent-%COMP%] {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-ds);
  transition: background 0.1s;
}
.prod-card[_ngcontent-%COMP%]:last-child { border-bottom: none; }
.prod-card[_ngcontent-%COMP%]:hover { background: var(--surface-2); }

.prod-avatar[_ngcontent-%COMP%] {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-ds);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.prod-info[_ngcontent-%COMP%] {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.prod-name[_ngcontent-%COMP%] {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.prod-sku[_ngcontent-%COMP%] {
  font-size: 11px;
  color: var(--text-subtle);
  font-family: var(--font-mono);
}

.prod-stock-badge[_ngcontent-%COMP%] {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
  background: var(--success-soft);
  color: var(--success);
  white-space: nowrap;
  flex-shrink: 0;
}
.prod-stock-badge.low[_ngcontent-%COMP%] {
  background: var(--warn-soft);
  color: var(--warn);
}

.prod-assign[_ngcontent-%COMP%] { flex-shrink: 0; }
.prod-select[_ngcontent-%COMP%] { font-size: 12px; padding: 5px 8px; height: auto; width: 160px; }

.prod-saving[_ngcontent-%COMP%] {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-subtle);
}



.modal-head-icon[_ngcontent-%COMP%] {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-ds);
  background: var(--accent-soft);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}



.label-opt[_ngcontent-%COMP%] { font-weight: 400; color: var(--text-subtle); font-size: 11px; }
.field-hint[_ngcontent-%COMP%] { font-size: 11px; color: var(--text-subtle); margin-top: 4px; }`]})}}return t})();export{Xe as ProductCategoriesComponent};
