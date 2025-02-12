import CalculateTree from "./CalculateTree/CalculateTree";
import { DatumType } from "./view/Models/DatumType";

export type State = {
  is_horizontal: boolean;
  node_separation: number;
  level_separation: number;
  single_parent_empty_card: boolean;
  tree: { data: DatumType[]; data_stash: any[]; dim: { width: number; height: number }; main_id: null } | { data: any[]; data_stash: any; dim: { width: any; height: any; x_off: number; y_off: number }; main_id: any; is_horizontal: boolean };
  main_id_history: any[];
  main_id: string;
  data: DatumType[];
}

export default function createStore(initial_state: State) {
  let onUpdate = (options: any) => void | null;
  const state = initial_state;
  state.main_id_history = [];

  const store = {
    state,
    updateTree: (props) => {
      state.tree = calcTree();
      if (!state.main_id) {
        updateMainId(state.tree.main_id);
      }
      if (onUpdate) {
        onUpdate(props);
      }
    },
    updateData: data => state.data = data,
    updateMainId,
    getMainId: () => state.main_id,
    getData: () => state.data,
    getTree: () => state.tree,
    setOnUpdate: (f) => onUpdate = f,

    getMainDatum,
    getDatum,
    getTreeMainDatum,
    getTreeDatum,
    getLastAvailableMainDatum,

    methods: {},
  };

  return store;

  function calcTree() {
    return CalculateTree({
      data: state.data,
      main_id: state.main_id,
      node_separation: state.node_separation,
      level_separation: state.level_separation,
      single_parent_empty_card: state.single_parent_empty_card,
      is_horizontal: state.is_horizontal
    });
  }

  function getMainDatum(): DatumType {
    return state.data.find(d => d.id === state.main_id);
  }

  function getDatum(id: string): DatumType {
    return state.data.find(d => d.id === id);
  }

  function getTreeMainDatum(): DatumType {
    if (!state.tree) {
      return null;
    }
    return state.tree.data.find(d => d.data.id === state.main_id);
  }

  function getTreeDatum(id: string): DatumType {
    if (!state.tree) {
      return null;
    }
    return state.tree.data.find(d => d.id === id);
  }

  function updateMainId(id: string) {
    if (id === state.main_id) {
      return;
    }
    state.main_id_history = state.main_id_history.filter(d => d !== id).slice(-10);
    state.main_id_history.push(id);
    state.main_id = id;
  }

  // if main_id is deleted, get the last available main_id
  function getLastAvailableMainDatum(): DatumType {
    let main_id = state.main_id_history.slice(0).reverse().find(id => getDatum(id));
    if (!main_id) {
      main_id = state.data[0].id;
    }
    if (main_id !== state.main_id) {
      updateMainId(main_id);
    }
    return getDatum(main_id);
  }
}
