<script>
    import Router from "svelte-spa-router";
    import {push} from 'svelte-spa-router'
    import routes from "./routes";
    import {afterUpdate, onMount} from "svelte";
    import {isExist} from "../scripts/store/store";

    let filePath = './db/evaluation.db';

    onMount(async () => {
        window.api.response('mainResponse', (data) => {
            $isExist = data;
            window.api.removeResponse('mainResponse');
        })
        window.api.request('existFile', filePath);
    })

    afterUpdate(() => {
        if (!!$isExist && $isExist) {
            push('/main');
        } else push('/step1')
    })

</script>

<Router {routes}/>