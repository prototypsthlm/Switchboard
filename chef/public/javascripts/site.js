$(document).ready(function(){
    
    var actionConfig;
    
    $("select.methods option:selected").each(function(){
        $(this).parents("div.api").find('#'+$(this).val()).show();
    });

    $("body").delegate("select.methods", "change", function(){
        console.log($(this));
        $('.api_action').hide();
        $("select.methods option:selected").each(function(){
            $(this).parents("div.api").find('#'+$(this).val()).show();
        });
    });
    
    $('button#cook').click(function(){
        actionConfig = [];
        $("div.api").each(function(){
        
           var order = $(this).find('select[name=index]').val();
           console.log(order);
           if(order != ""){
               var action = $(this).find("select.methods").val();
               var in_param = $(this).find("#"+action).find("select[name=in_param]").val();
               var out = $(this).find("#"+action).find("select[name=out]").val();
               actionConfig.push({order: order, api: $(this).attr('name'), action: action, in_param: in_param, out: out });
           }
        });
        console.log(actionConfig);
        $.post('/cook', { data: actionConfig }, function(data) {
          console.log(data);
          $('.results').html('Recipe updated');
          $('.results').fadeIn();
          setTimeout(function(){
                $('.results').html('');
          }, 5000);
              
        });
    });
    
    $('.ingredient').click(function(){
        var add = $(this).attr('ingredient');
        $('div.api.dummy[name="'+add+'"]').clone().removeClass('dummy').appendTo('body');
    });
});