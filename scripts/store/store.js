import {readable, writable} from "svelte/store";
import {getCurrentYear} from "../util/common";

export let companyName = writable('');
export let companySeq = writable('');
export let year = readable(getCurrentYear());