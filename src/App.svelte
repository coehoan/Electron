<script>
    import Router from "svelte-spa-router";
    import {push} from 'svelte-spa-router'
    import routes from "./routes";
    import {afterUpdate, onMount} from "svelte";
    import {initData, isExist} from "../scripts/store/store";

    onMount(async () => {
        console.log('app onMount!')
        window.api.response('mainResponse', (data) => {
            $isExist = data;
            window.api.removeResponse('mainResponse');
        })
        window.api.request('existFile');
    })

    afterUpdate(() => {
        // 환경설정 - 평가데이터 가져오기 아닌 경우
        if ($initData.status !== 'reimport') {
            if (!!$isExist && $isExist) {
                push('/main');
            } else {
                $initData.status = 'init';
                push('/step1');
            }
        }
    })

</script>

<Router {routes}/>