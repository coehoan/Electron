import {writable} from "svelte/store";

export let companyName = writable('');
export let companySeq = writable('');
export let companyCode = writable('');
export let companyYear = writable(''); // 해당년도
export let completeYn = writable('N'); // 현장실사 완료 여부
export let isExist = writable(); // evaluation.db 파일 존재 유무
export let isFinalListShow = writable(false); // 최종 평가 결과 리스트 노출 여부