import { checkIfRelativesConnectedWithoutPerson } from "./checkIfRelativesConnectedWithoutPerson";
import { createTreeDataWithMainNode } from "./newPerson";
import { Store } from "../Cards/CardBase";
import { AddRelative } from "./addRelative";
import { Person } from "../CalculateTree/CalculateTree";

export type GenderField = {
  id: string;
  type: string;
  label: string;
  initial_value: any;
  options: { value: string, label: string }[];
}

export type Form = {
  other_parent_field?: boolean;
  fields: any[];
  onSubmit: (e: Event) => void;
  onDelete?: () => void;
  addRelative?: () => void;
  addRelativeCancel?: () => void;
  addRelativeActive?: boolean;
  onCancel?: () => void;
  deletePerson?: () => void;
  editable?: boolean;
  title?: string;
  new_rel?: boolean;
  can_delete?: boolean;
  gender_field?: GenderField;
  no_edit?: boolean;
}

export type CardDisplay = string | (() => void) | [];

export type FormUpdateOptions = {
  datum: Person;
  store: Store<any>;
  fields: any[];
  postSubmit: (params?: { delete: boolean }) => void;
  addRelative: AddRelative<any>;
  deletePerson: (datum: Person, data_stash: Person[]) => { success: boolean, error?: string };
  onCancel: () => void;
  editFirst: boolean;
};

export function createForm({ datum, store, fields, postSubmit, addRelative, deletePerson, onCancel, editFirst }: FormUpdateOptions): Form {
  const form_creator: Form = {
    fields: [],
    onSubmit: submitFormChanges,
  };
  if (!datum._new_rel_data) {
    form_creator.onDelete = deletePersonWithPostSubmit;
    form_creator.addRelative = () => addRelative.activate(datum);
    form_creator.addRelativeCancel = () => addRelative.onCancel();
    form_creator.addRelativeActive = addRelative.is_active;
    form_creator.editable = false;
  }
  if (datum._new_rel_data) {
    form_creator.title = datum._new_rel_data.label;
    form_creator.new_rel = true;
    form_creator.editable = true;
    form_creator.onCancel = onCancel;
  }
  if (form_creator.onDelete) {
    form_creator.can_delete = checkIfRelativesConnectedWithoutPerson(datum, store.getData());
  }

  if (editFirst) {
    form_creator.editable = true;
  }

  form_creator.gender_field = {
    id: "gender",
    type: "switch",
    label: "Gender",
    initial_value: datum.data.gender,
    options: [ { value: "M", label: "Male" }, { value: "F", label: "Female" } ]
  };

  fields.forEach(d => {
    const field = {
      id: d.id,
      type: d.type,
      label: d.label,
      initial_value: datum.data[d.id],
    };
    form_creator.fields.push(field);
  });

  return form_creator;

  function submitFormChanges(e) {
    e.preventDefault();
    const form_data = new FormData(e.target);
    form_data.forEach((v, k) => datum.data[k] = v);
    if (datum.to_add) {
      delete datum.to_add;
    }
    postSubmit();
  }

  function deletePersonWithPostSubmit() {
    deletePerson();
    postSubmit({ delete: true });
  }
}

export function moveToAddToAdded(datum: Person, data_stash: Person[]): Person {
  delete datum.to_add;
  return datum;
}

export function removeToAdd(datum: Person, data_stash: Person[]): boolean {
  deletePerson(datum, data_stash); // TODO: Return value not used.
  return false;
}

export function deletePerson(datum: Person, data_stash: Person[] = []): { success: boolean, error?: string } {
  if (!checkIfRelativesConnectedWithoutPerson(datum, data_stash)) {
    return { success: false, error: "checkIfRelativesConnectedWithoutPerson" };
  }
  executeDelete();
  return { success: true };

  function executeDelete() {
    data_stash.forEach(d => {
      for (let k in d.rels) {
        if (!d.rels.hasOwnProperty(k)) {
          continue;
        }
        if (d.rels[k] === datum.id) {
          delete d.rels[k];
        } else if (Array.isArray(d.rels[k]) && d.rels[k].includes(datum.id)) {
          d.rels[k].splice(d.rels[k].findIndex(did => did === datum.id), 1);
        }
      }
    });
    data_stash.splice(data_stash.findIndex(d => d.id === datum.id), 1);
    data_stash.forEach(d => {
      if (d.to_add) {
        deletePerson(d, data_stash);
      }
    });  // full update of tree
    if (data_stash.length === 0) {
      data_stash.push(createTreeDataWithMainNode({ data: {}, version: false }).data[0]);
    }
  }
}

export function cleanupDataJson(data_json: string) {
  let data_no_to_add: Person[] = JSON.parse(data_json);
  data_no_to_add.forEach(d => d.to_add ? removeToAdd(d, data_no_to_add) : d);
  data_no_to_add.forEach(d => delete d.main);
  data_no_to_add.forEach(d => delete d.hide_rels);
  return JSON.stringify(data_no_to_add, null, 2);
}

export function removeToAddFromData(data) {
  data.forEach(d => d.to_add ? removeToAdd(d, data) : d);
  return data;
}
