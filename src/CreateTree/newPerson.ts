import { removeToAdd } from './form';
import { Gender, type Person, type PersonData, type Relatives } from '../CalculateTree/CalculateTree';
import { generateUUID } from '../lib/utils';

export enum RelType {
  Son, Spouse, Mother, Daughter, Father
}

export type RelDatum = {
  datum: Person;
  data_stash: Person[];
  rel_type: RelType;
  rel_datum: Person;
}

export function handleRelsOfNewDatum({ datum, data_stash, rel_type, rel_datum }: RelDatum) {
  if (rel_type === RelType.Daughter || rel_type === RelType.Son) {
    addChild(datum);
  } else if (rel_type === RelType.Father || rel_type === RelType.Mother) {
    addParent(datum);
  } else if (rel_type === RelType.Spouse) {
    addSpouse(datum);
  }

  function addChild(datum: Person) {
    if (datum.data.other_parent) {
      addChildToSpouseAndParentToChild(datum.data.other_parent);
      delete datum.data.other_parent;
    }

    if (rel_datum.data.gender === Gender.M) {
      datum.rels.father = rel_datum.id;
    }
    datum.rels[rel_datum.data.gender === Gender.M ? 'father' : 'mother'] = rel_datum.id;
    if (!rel_datum.rels.children) {
      rel_datum.rels.children = [];
    }
    rel_datum.rels.children.push(datum.id);
    return datum;

    function addChildToSpouseAndParentToChild(spouse_id: string) {
      if (spouse_id === '_new') {
        spouse_id = addOtherParent().id;
      }

      const spouse = data_stash.find(d => d.id === spouse_id);
      if (spouse) {
        datum.rels[spouse.data.gender === Gender.M ? 'father' : 'mother'] = spouse.id;
        if (!spouse.rels.hasOwnProperty('children')) {
          spouse.rels.children = [];
        }
        spouse.rels.children.push(datum.id);
      }

      function addOtherParent() {
        const new_spouse = createNewPersonWithGenderFromRel({ rel_type: RelType.Spouse, rel_datum });
        addSpouse(new_spouse);
        addNewPerson({ data_stash, datum: new_spouse });
        return new_spouse;
      }
    }
  }

  function addParent(datum: Person) {
    const is_father = datum.data.gender === Gender.M;
    const parent_to_add_id = rel_datum.rels[is_father ? 'father' : 'mother'];

    if (parent_to_add_id) {
      removeToAdd(data_stash.find(d => d.id === parent_to_add_id), data_stash);
    }
    addNewParent();

    function addNewParent(): Person | null {
      rel_datum.rels[is_father ? 'father' : 'mother'] = datum.id;
      handleSpouse();
      datum.rels.children = [rel_datum.id];
      return datum;

      function handleSpouse() {
        const spouse_id = rel_datum.rels[!is_father ? 'father' : 'mother'];
        if (!spouse_id) {
          return;
        }
        datum.rels.spouses = [spouse_id];
        const spouse = data_stash.find(d => d.id === spouse_id);
        if (spouse) {
          if (!spouse.rels.spouses) {
            spouse.rels.spouses = [];
          }
          spouse.rels.spouses.push(datum.id);
          return spouse;
        }
        return null;
      }
    }
  }

  function addSpouse(datum: Person) {
    removeIfToAdd();
    if (!rel_datum.rels.spouses) {
      rel_datum.rels.spouses = [];
    }
    rel_datum.rels.spouses.push(datum.id);
    datum.rels.spouses = [rel_datum.id];

    function removeIfToAdd() {
      if (!rel_datum.rels.spouses) {
        return;
      }
      rel_datum.rels.spouses.forEach(spouse_id => {
        const spouse = data_stash.find(d => d.id === spouse_id);
        if (spouse && spouse.to_add) {
          removeToAdd(spouse, data_stash);
        }
      });
    }
  }
}

export function handleNewRel({ datum, new_rel_datum, data_stash }: { datum: Person, new_rel_datum: Person, data_stash: Person[] }) {
  const rel_type = new_rel_datum._new_rel_data.rel_type;
  delete new_rel_datum._new_rel_data;
  new_rel_datum = JSON.parse(JSON.stringify(new_rel_datum));  // to keep same datum state in current add relative tree

  switch (rel_type) {
    case RelType.Son:
    case RelType.Daughter:
      let mother = data_stash.find(d => d.id === new_rel_datum.rels.mother);
      let father = data_stash.find(d => d.id === new_rel_datum.rels.father);

      new_rel_datum.rels = { children: [] };
      if (father) {
        if (!father.rels.children) {
          father.rels.children = [];
        }
        father.rels.children.push(new_rel_datum.id);
        new_rel_datum.rels.father = father.id;
      }
      if (mother) {
        if (!mother.rels.children) {
          mother.rels.children = [];
        }
        mother.rels.children.push(new_rel_datum.id);
        new_rel_datum.rels.mother = mother.id;
      }
      break;
    case RelType.Spouse:
      if (!datum.rels.spouses) {
        datum.rels.spouses = [];
      }
      if (!datum.rels.spouses.includes(new_rel_datum.id)) {
        datum.rels.spouses.push(new_rel_datum.id);
      }

      // if rel is added in same same add relative tree then we need to clean up duplicate parent
      new_rel_datum.rels.children = new_rel_datum.rels.children.filter(child_id => {
        const child = data_stash.find(d => d.id === child_id);
        if (!child) {
          return false;
        }
        if (child.rels.mother !== datum.id) {
          if (data_stash.find(d => d.id === child.rels.mother)) {
            data_stash.splice(data_stash.findIndex(d => d.id === child.rels.mother), 1);
          }
          child.rels.mother = new_rel_datum.id;
        }
        if (child.rels.father !== datum.id) {
          if (data_stash.find(d => d.id === child.rels.father)) {
            data_stash.splice(data_stash.findIndex(d => d.id === child.rels.father), 1);
          }
          child.rels.father = new_rel_datum.id;
        }
        return true;
      });

      new_rel_datum.rels = {
        spouses: [datum.id],
        children: new_rel_datum.rels.children
      };
      break;
    case RelType.Father:
      datum.rels.father = new_rel_datum.id;
      new_rel_datum.rels = {
        children: [datum.id],
      };
      if (datum.rels.mother) {
        new_rel_datum.rels.spouses = [datum.rels.mother];
        const mother = data_stash.find(d => d.id === datum.rels.mother);
        if (mother) {
          if (!mother.rels.spouses) {
            mother.rels.spouses = [];
          }
          mother.rels.spouses.push(new_rel_datum.id);
        }
      }
      break;
    case RelType.Mother:
      datum.rels.mother = new_rel_datum.id;
      new_rel_datum.rels = {
        children: [datum.id],
      };
      if (datum.rels.father) {
        new_rel_datum.rels.spouses = [datum.rels.father];
        const father = data_stash.find(d => d.id === datum.rels.father);
        if (father) {
          if (!father.rels.spouses) {
            father.rels.spouses = [];
          }
          father.rels.spouses.push(new_rel_datum.id);
        }
      }
      break;
  }

  data_stash.push(new_rel_datum);
}

export function createNewPerson({ data, rels }: { data?: PersonData, rels?: Relatives }): Person {
  return { id: generateUUID(), data, rels };
}

export function createNewPersonWithGenderFromRel({ data, rel_type, rel_datum }: { data?: any, rel_type: RelType, rel_datum: Person }): Person {
  const gender = getGenderFromRelative(rel_datum, rel_type);
  data = Object.assign(data || {}, { gender });
  return createNewPerson({ data });

  function getGenderFromRelative(rel_datum: Person, rel_type: RelType: Gender {
    return (rel_type === RelType.Daughter || RelType.Mother) || rel_type === RelType.Spouse && rel_datum.data.gender === Gender.M ? Gender.F : Gender.M;
  }
}

export function addNewPerson({ data_stash, datum }) {
  data_stash.push(datum);
}

export function createTreeDataWithMainNode({ data, version }) {
  return { data: [createNewPerson({ data })], version };
}

export function addNewPersonAndHandleRels({ datum, data_stash, rel_type, rel_datum }) {
  addNewPerson({ data_stash, datum });
  handleRelsOfNewDatum({ datum, data_stash, rel_type, rel_datum });
}
