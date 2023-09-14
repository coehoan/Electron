<script>
    import Router from "svelte-spa-router";
    import {push} from 'svelte-spa-router'
    import routes from "./routes";
    import {afterUpdate, onMount} from "svelte";

    let filePath = './db/evaluation.db';
    let isExist;

    onMount(async () => {
        window.api.response('main-response', (data) => {
            isExist = data;
        })
        window.api.request('existFile', filePath);
    })

    afterUpdate(() => {
        if (!!isExist && isExist) {
            push('/main');
        } else push('/step1')
    })

</script>

<div style="display: none">
    {isExist}
</div>
<Router {routes}/>