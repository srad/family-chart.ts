import { select } from "d3";
import addRelative, { AddRelative } from "./addRelative";
import { cleanupDataJson, createForm, deletePerson } from "./form";
import { Store } from "../Cards/CardBase";
import { createHistory, createHistoryControls, History } from "./history";
import { formInfoSetup } from "./formInfoSetup";
import { Person } from "../CalculateTree/CalculateTree";
import { DatumType } from "../view/Models/DatumType";

export default function (cont: HTMLElement, store: Store<DatumType>) {
  return new EditTree(cont, store);
}

export class EditTree {
  private readonly cont: HTMLElement;
  protected store: Store<DatumType>;
  private fields: ({ type: string; label: string; id: string })[];
  private form_cont?: HTMLElement;
  private is_fixed: boolean;
  private editFirst: boolean;
  private no_edit: boolean;
  private onChange: () => void;
  private history: History;
  private addRelativeInstance: AddRelative<DatumType>;

  constructor(cont: HTMLElement, store: Store<DatumType>) {
    this.cont = cont;
    this.store = store;

    this.fields = [
      { type: "text", label: "first name", id: "first name" },
      { type: "text", label: "last name", id: "last name" },
      { type: "text", label: "birthday", id: "birthday" },
      { type: "text", label: "avatar", id: "avatar" }
    ];

    this.form_cont = null;

    this.is_fixed = true;

    this.history = null;
    this.no_edit = false;

    this.onChange = null;

    this.editFirst = false;

    this.init();
  }

  init() {
    this.form_cont = select(this.cont).append("div").classed("f3-form-cont", true).node();
    this.addRelativeInstance = this.setupAddRelative();
    this.createHistory();
  }

  open(datum: Person) {
    // TODO: What is going on there?
    //if (datum.data.data) {
    //  datum = datum.data;
    //}
    if (this.addRelativeInstance.is_active && !datum._new_rel_data) {
      this.addRelativeInstance.onCancel();
      datum = this.store.getDatum(datum.id);
    }

    this.cardEditForm(datum);
  }

  openWithoutRelCancel(datum: Person) {
    // TODO: What is going on there?
    //if (datum.data.data) {
    //  datum = datum.data;
    //}

    this.cardEditForm(datum);
  }

  cardEditForm(datum: Person) {
    const props: { onCancel?: () => void, addRelative?: AddRelative<DatumType>, deletePerson?: (datum: Person, data_stash: Person[]) => { success: boolean, error?: string } } = {};
    const is_new_rel = datum?._new_rel_data;
    if (is_new_rel) {
      props.onCancel = () => this.addRelativeInstance.onCancel();
    } else {
      props.addRelative = this.addRelativeInstance;
      props.deletePerson = (): { success: boolean, error?: string } => {
        const data = this.store.getData();
        const result = deletePerson(datum, data);
        this.store.updateData(data);
        this.openFormWithId(this.store.getLastAvailableMainDatum().id);
        this.store.updateTree({});
        return result;
      };
    }

    const form_creator = createForm({
      deletePerson,
      store: this.store,
      datum,
      postSubmit: postSubmit.bind(this),
      fields: this.fields,
      //card_display: this.card_display,
      addRelative: null,
      onCancel: () => {
      },
      editFirst: this.editFirst,
      ...props
    });

    form_creator.no_edit = this.no_edit;
    const form_cont = formInfoSetup(form_creator, this.closeForm.bind(this));

    this.form_cont.innerHTML = "";
    this.form_cont.appendChild(form_cont);

    this.openForm();

    function postSubmit(props) {
      if (this.addRelativeInstance.is_active) {
        this.addRelativeInstance.onChange(datum);
      } else if (!props?.delete) {
        this.openFormWithId(datum.id);
      }

      if (!this.is_fixed) {
        this.closeForm();
      }

      this.store.updateTree({});

      this.updateHistory();
    }
  }

  openForm() {
    select(this.form_cont).classed("opened", true);
  }

  closeForm() {
    select(this.form_cont).classed("opened", false).html("");
    this.store.updateTree({});
  };

  fixed() {
    this.is_fixed = true;
    select(this.form_cont).style("position", "relative");

    return this;
  }

  absolute() {
    this.is_fixed = false;
    select(this.form_cont).style("position", "absolute");

    return this;
  }

  setCardClickOpen(card) {
    card.setOnCardClick((e, d) => {
      if (this.addRelativeInstance.is_active) {
        this.open(d);
        return;
      }
      this.open(d);
      this.store.updateMainId(d.data.id);
      this.store.updateTree({});
    });

    return this;
  }

  openFormWithId(d_id: string) {
    if (d_id) {
      const d = this.store.getDatum(d_id);
      this.openWithoutRelCancel(d);
    } else {
      const d = this.store.getMainDatum();
      this.openWithoutRelCancel(d);
    }
  }

  createHistory() {
    this.history = createHistory(this.store, this.getStoreData.bind(this), historyUpdateTree.bind(this));
    this.history.controls = createHistoryControls(this.cont, this.history);
    this.history.changed();
    this.history.controls.updateButtons();

    return this;

    function historyUpdateTree() {
      if (this.addRelativeInstance.is_active) {
        this.addRelativeInstance.onCancel();
      }
      this.store.updateTree({ initial: false });
      this.history.controls.updateButtons();
      this.openFormWithId(this.store.getMainDatum()?.id);
    }
  }

  setNoEdit() {
    this.no_edit = true;

    return this;
  };

  setEdit() {
    this.no_edit = false;

    return this;
  }

  setFields(fields) {
    const new_fields = [];
    if (!Array.isArray(fields)) {
      console.error("fields must be an array");
      return this;
    }
    for (const field of fields) {
      if (typeof field === "string") {
        new_fields.push({ type: "text", label: field, id: field });
      } else if (typeof field === "object") {
        if (!field.id) {
          console.error("fields must be an array of objects with id property");
        } else {
          new_fields.push(field);
        }
      } else {
        console.error("fields must be an array of strings or objects");
      }
    }
    this.fields = new_fields;

    return this;
  }

  setOnChange(fn) {
    this.onChange = fn;

    return this;
  }

  addRelative(datum?: Person) {
    if (!datum) {
      datum = this.store.getMainDatum();
    }
    this.addRelativeInstance.activate(datum);
    return this;
  }

  setupAddRelative() {
    const that = this;
    return addRelative(this.store, cancelCallback, onSubmitCallback);

    function onSubmitCallback(datum: Person /*, new_rel_datum: Person*/) {
      that.store.updateMainId(datum.id);
      that.openFormWithId(datum.id);
    }

    function cancelCallback(datum: Person) {
      that.store.updateMainId(datum.id);
      that.store.updateTree({});
      that.openFormWithId(datum.id);
    }
  }

  setEditFirst(editFirst) {
    this.editFirst = editFirst;
    return this;
  }

  isAddingRelative() {
    return this.addRelativeInstance.is_active;
  }

  setAddRelLabels(add_rel_labels) {
    this.addRelativeInstance.setAddRelLabels(add_rel_labels);
    return this;
  }

  getStoreData() {
    if (this.addRelativeInstance.is_active) {
      return this.addRelativeInstance.getStoreData();
    } else {
      return this.store.getData();
    }
  }

  getDataJson(fn) {
    const data = this.getStoreData();
    return cleanupDataJson(JSON.stringify(data));
  }

  updateHistory() {
    if (this.history) {
      this.history.changed();
      this.history.controls.updateButtons();
    }

    if (this.onChange) {
      this.onChange();
    }
  }

  destroy() {
    this.history.controls.destroy();
    this.history = null;
    select(this.cont).select(".f3-form-cont").remove();
    if (this.addRelativeInstance.onCancel) {
      this.addRelativeInstance.onCancel();
    }
    this.store.updateTree({});

    return this;
  }
}
