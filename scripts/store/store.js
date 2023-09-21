import {readable, writable} from "svelte/store";
import {getCurrentYear} from "../util/common";

export let companyName = writable('');
export let companySeq = writable('');
export let year = readable(getCurrentYear()); // 해당년도
export let isExist = writable(); // evaluation.db 파일 존재 유무
export let isFinalListShow = writable(false); // 최종 평가 결과 리스트 노출 여부