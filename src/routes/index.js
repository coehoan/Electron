import Step1 from "./init/Step1.svelte";
import Step2 from "./init/Step2.svelte";
import Step3 from "./init/Step3.svelte";
import Main from "./main/Main.svelte";
import CompanyInfo from "./main/CompanyInfo.svelte";
import SelfEvaluation from "./main/SelfEvaluation.svelte";
import Inspect from "./main/Inspect.svelte";
import FinalResult from "./main/FinalResult.svelte";

const routes = {
    '/step1': Step1,
    '/step2': Step2,
    '/step3': Step3,
    '/main': Main,
    '/info': CompanyInfo,
    '/self': SelfEvaluation,
    '/inspect': Inspect,
    '/result': FinalResult
}

export default routes;